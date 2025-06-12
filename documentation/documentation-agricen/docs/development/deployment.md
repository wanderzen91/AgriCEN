# Déploiement

Ce guide explique comment déployer l'application AgriCEN dans un environnement de production.

## Prérequis pour le déploiement

- Un serveur Linux (recommandé : Ubuntu 20.04 LTS ou supérieur)
- PostgreSQL 12+ avec PostGIS installé
- Python 3.8 ou supérieur
- Nginx comme serveur web frontal
- Certificats SSL (Let's Encrypt recommandé)
- Compte Azure AD configuré pour l'authentification

## Préparation de l'environnement de production

### Installation des dépendances système

```bash
# Mise à jour des paquets
apt update && apt upgrade -y

# Installation des dépendances
apt install -y python3 python3-pip python3-venv postgresql postgresql-contrib postgis nginx supervisor

# Bibliothèques pour PostgreSQL et les compilateurs C (nécessaires pour certains paquets Python)
apt install -y libpq-dev build-essential python3-dev
```

### Création d'un utilisateur de service

```bash
# Création d'un utilisateur dédié
adduser --system --group --shell /bin/bash agricen

# Passage au répertoire de l'utilisateur
cd /home/agricen
```

## Configuration de la base de données

### Création des bases de données

```bash
# Connexion à PostgreSQL
sudo -u postgres psql

# Création des bases de données
CREATE DATABASE agricen;
CREATE DATABASE fonciercen;

# Activer l'extension PostGIS sur les deux bases
\c agricen
CREATE EXTENSION postgis;

\c fonciercen
CREATE EXTENSION postgis;

# Créer un utilisateur dédié
CREATE USER agricen_user WITH PASSWORD 'mot_de_passe_securise';
GRANT ALL PRIVILEGES ON DATABASE agricen TO agricen_user;
GRANT ALL PRIVILEGES ON DATABASE fonciercen TO agricen_user;

# Création des schémas
\c agricen
CREATE SCHEMA saisie;
CREATE SCHEMA referentiel;

# Attribution des droits
GRANT ALL ON SCHEMA saisie TO agricen_user;
GRANT ALL ON SCHEMA referentiel TO agricen_user;
```

### Sauvegarde et restauration des données

Si vous déployez une nouvelle version de l'application avec une base de données existante :

```bash
# Création d'une sauvegarde (serveur source)
pg_dump -U postgres agricen > agricen_backup.sql
pg_dump -U postgres fonciercen > fonciercen_backup.sql

# Transfert des fichiers vers le serveur cible
scp agricen_backup.sql fonciercen_backup.sql utilisateur@serveur_cible:/chemin/destination/

# Restauration des données (serveur cible)
psql -U postgres agricen < agricen_backup.sql
psql -U postgres fonciercen < fonciercen_backup.sql
```

## Déploiement de l'application

### Récupération du code source

```bash
# En tant qu'utilisateur agricen
cd /home/agricen
git clone https://github.com/votre-organisation/AgriCEN.git
cd AgriCEN/Flask-Leaflet
```

### Configuration de l'environnement Python

```bash
# Création de l'environnement virtuel
python3 -m venv venv
source venv/bin/activate

# Installation des dépendances
pip install --upgrade pip
pip install -r requirements.txt

# En production, ajout de dépendances supplémentaires
pip install gunicorn gevent
```

### Configuration de l'application

Créez un fichier `.env.production` pour stocker les variables d'environnement de production :

```
# Environnement
FLASK_ENV=production
FLASK_APP=app.py

# Base de données
DATABASE_URL=postgresql://agricen_user:mot_de_passe_securise@localhost:5432/agricen
SECONDARY_DATABASE_URL=postgresql://agricen_user:mot_de_passe_securise@localhost:5432/fonciercen

# Sécurité
SECRET_KEY=generer_une_cle_securisee_ici
WTF_CSRF_SECRET_KEY=generer_une_autre_cle_securisee_ici

# Azure AD
CLIENT_ID=votre_client_id_azure
CLIENT_SECRET=votre_client_secret_azure
TENANT_ID=votre_tenant_id_azure
REDIRECT_URI=https://votre-domaine.fr/auth/callback

# API SIRENE
SIRENE_TOKEN=votre_token_sirene

# Options de production
SESSION_COOKIE_SECURE=True
SESSION_COOKIE_HTTPONLY=True
REMEMBER_COOKIE_SECURE=True
```

### Configuration de Gunicorn

Créez un fichier `gunicorn.conf.py` à la racine du projet :

```python
# Fichier gunicorn.conf.py
bind = "127.0.0.1:8000"
workers = 4  # Généralement (2 x nombre de cœurs) + 1
worker_class = 'gevent'
timeout = 120
errorlog = '/home/agricen/AgriCEN/Flask-Leaflet/logs/gunicorn-error.log'
accesslog = '/home/agricen/AgriCEN/Flask-Leaflet/logs/gunicorn-access.log'
loglevel = 'info'
proc_name = 'agricen'
```

### Configuration de Supervisor

Supervisor permet de gérer l'application comme un service et d'assurer son redémarrage automatique en cas de problème.

Créez un fichier `/etc/supervisor/conf.d/agricen.conf` :

```ini
[program:agricen]
command=/home/agricen/AgriCEN/Flask-Leaflet/venv/bin/gunicorn -c /home/agricen/AgriCEN/Flask-Leaflet/gunicorn.conf.py app:app
directory=/home/agricen/AgriCEN/Flask-Leaflet
user=agricen
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/home/agricen/AgriCEN/Flask-Leaflet/logs/supervisor.log
environment=
    FLASK_ENV="production",
    FLASK_APP="app.py",
    DATABASE_URL="postgresql://agricen_user:mot_de_passe_securise@localhost:5432/agricen",
    SECONDARY_DATABASE_URL="postgresql://agricen_user:mot_de_passe_securise@localhost:5432/fonciercen",
    SECRET_KEY="votre_cle_secrete",
    CLIENT_ID="votre_client_id_azure",
    CLIENT_SECRET="votre_client_secret_azure",
    TENANT_ID="votre_tenant_id_azure",
    SIRENE_TOKEN="votre_token_sirene"
```

Activez et démarrez le service :

```bash
# Création du répertoire des logs
mkdir -p /home/agricen/AgriCEN/Flask-Leaflet/logs

# Chargement de la configuration
supervisorctl reread
supervisorctl update

# Démarrage du service
supervisorctl start agricen
```

### Configuration de Nginx

Nginx servira de proxy inverse pour Gunicorn et gérera SSL, la mise en cache statique et d'autres optimisations.

Créez un fichier `/etc/nginx/sites-available/agricen` :

```nginx
server {
    listen 80;
    server_name votre-domaine.fr;
    
    # Redirection vers HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name votre-domaine.fr;

    # Certificats SSL
    ssl_certificate /etc/letsencrypt/live/votre-domaine.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.fr/privkey.pem;
    
    # Paramètres SSL optimisés
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers "EECDH+AESGCM:EDH+AESGCM:AES256+EECDH:AES256+EDH";
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # En-têtes de sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    
    # Fichiers statiques
    location /static {
        alias /home/agricen/AgriCEN/Flask-Leaflet/static;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
    
    # Proxy vers Gunicorn
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_http_version 1.1;
        proxy_read_timeout 120s;
    }
}
```

Activez la configuration et redémarrez Nginx :

```bash
# Création d'un lien symbolique
ln -s /etc/nginx/sites-available/agricen /etc/nginx/sites-enabled/

# Test de la configuration
nginx -t

# Redémarrage de Nginx
systemctl restart nginx
```

### Obtention de certificats SSL avec Let's Encrypt

```bash
# Installation de Certbot
apt install -y certbot python3-certbot-nginx

# Obtention du certificat
certbot --nginx -d votre-domaine.fr
```

## Initialisation de la base de données en production

```bash
# Activation de l'environnement virtuel
cd /home/agricen/AgriCEN/Flask-Leaflet
source venv/bin/activate

# Application des migrations
export FLASK_APP=app.py
flask db upgrade

# Chargement des données de référence (si nécessaire)
python populate_ref_data.py
```

## Configuration de sauvegardes automatiques

Créez un script de sauvegarde `/home/agricen/backup_agricen.sh` :

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/agricen/backups"
DATE=$(date +%Y-%m-%d_%H-%M)
PGUSER="postgres"

# Création du répertoire de sauvegarde si nécessaire
mkdir -p $BACKUP_DIR

# Sauvegarde des bases
pg_dump -U $PGUSER agricen > "$BACKUP_DIR/agricen_$DATE.sql"
pg_dump -U $PGUSER fonciercen > "$BACKUP_DIR/fonciercen_$DATE.sql"

# Compression
gzip "$BACKUP_DIR/agricen_$DATE.sql"
gzip "$BACKUP_DIR/fonciercen_$DATE.sql"

# Suppression des sauvegardes de plus de 30 jours
find $BACKUP_DIR -name "*.gz" -type f -mtime +30 -delete
```

Rendez le script exécutable et configurez une tâche cron :

```bash
chmod +x /home/agricen/backup_agricen.sh

# Configuration cron pour une sauvegarde quotidienne à 2h00
echo "0 2 * * * /home/agricen/backup_agricen.sh" | crontab -
```

## Surveillance et journalisation

### Configuration des logs

Configurez la rotation des logs pour éviter qu'ils ne deviennent trop volumineux :

```bash
# Installation de logrotate
apt install -y logrotate

# Création d'une configuration pour les logs AgriCEN
cat > /etc/logrotate.d/agricen << EOL
/home/agricen/AgriCEN/Flask-Leaflet/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 agricen agricen
    sharedscripts
    postrotate
        supervisorctl restart agricen
    endscript
}
EOL
```

### Surveillance des performances

Pour surveiller les performances du serveur, installez et configurez un outil comme Prometheus avec Node Exporter et Grafana.

## Mise à jour de l'application

Processus de déploiement d'une nouvelle version :

```bash
# Connexion au serveur
ssh agricen@votre-serveur

# Passage au répertoire du projet
cd /home/agricen/AgriCEN

# Récupération des dernières modifications
git pull origin main

# Activation de l'environnement virtuel
cd Flask-Leaflet
source venv/bin/activate

# Mise à jour des dépendances
pip install -r requirements.txt

# Application des migrations
flask db upgrade

# Redémarrage de l'application
supervisorctl restart agricen
```

## Configuration Azure AD pour la production

En production, vous devez configurer correctement l'application Azure AD :

1. Dans le portail Azure, mettez à jour l'URI de redirection avec votre domaine de production
2. Vérifiez que les autorisations sont correctement configurées
3. Assurez-vous que les utilisateurs qui doivent accéder à l'application sont correctement ajoutés

## Redirection HTTP vers HTTPS

Pour rediriger automatiquement tout le trafic HTTP vers HTTPS, vous avez déjà configuré la redirection dans Nginx.

## Hardening du serveur

Pour renforcer la sécurité du serveur :

1. **Pare-feu** : Configurez UFW pour n'autoriser que les ports nécessaires
   ```bash
   ufw allow ssh
   ufw allow http
   ufw allow https
   ufw enable
   ```

2. **Fail2Ban** : Protection contre les tentatives de connexion répétées
   ```bash
   apt install fail2ban
   ```

3. **Mise à jour automatique** : Configuration des mises à jour de sécurité
   ```bash
   apt install unattended-upgrades
   ```

4. **SSH** : Sécuriser SSH en désactivant la connexion par mot de passe
   ```bash
   # Éditer le fichier /etc/ssh/sshd_config
   # Définir PasswordAuthentication no
   systemctl restart ssh
   ```

## Checklist finale de déploiement

- [ ] Bases de données créées et configurées avec PostGIS
- [ ] Application déployée et configurations environnement ajustées
- [ ] Gunicorn configuré comme serveur WSGI
- [ ] Supervisor configuré pour la gestion du processus
- [ ] Nginx configuré comme proxy inverse
- [ ] Certificats SSL installés
- [ ] Sauvegardes automatiques configurées
- [ ] Pare-feu et autres mesures de sécurité activées
- [ ] Application Azure AD correctement configurée
