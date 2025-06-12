# Connexion à l'application

AgriCEN utilise l'authentification Microsoft Entra ID pour sécuriser l'accès à l'application. Ce système garantit que seuls les utilisateurs autorisés peuvent accéder aux données.

## Écran de connexion

![Écran de connexion](../assets/login.png)

L'écran de connexion est la première interface que vous rencontrez lors de l'accès à l'application. Il comporte un bouton "Se connecter avec Microsoft" qui vous redirige vers l'authentification Microsoft Entra ID.

## Processus d'authentification

1. **Accès à l'application** : Accédez à l'URL de l'application AgriCEN
2. **Redirection vers Microsoft** : Cliquez sur le bouton "Se connecter avec Microsoft"
3. **Authentification** : Saisissez vos identifiants Microsoft (email et mot de passe)
4. **Autorisation** : Si c'est votre première connexion, vous devrez peut-être autoriser l'application à accéder à votre compte
5. **Redirection vers l'application** : Une fois authentifié, vous serez automatiquement redirigé vers l'interface principale d'AgriCEN

## Sessions et déconnexion

- **Durée de session** : Votre session reste active pendant 2 heures. Au-delà, une reconnexion sera nécessaire.
- **Déconnexion manuelle** : À tout moment, vous pouvez vous déconnecter en cliquant sur le bouton "Déconnexion" situé dans le menu utilisateur en haut à droite de l'interface.

## Problèmes de connexion

Si vous rencontrez des difficultés pour vous connecter :

1. **Vérifiez votre compte** : Assurez-vous d'utiliser le compte Microsoft qui vous a été attribué pour accéder à l'application
2. **Videz le cache du navigateur** : Les problèmes persistants peuvent parfois être résolus en effaçant le cache et les cookies
3. **Contactez la DSI** : Si les problèmes persistent, contactez la DSI

## Autorisations

Les autorisations dans AgriCEN sont gérées au niveau d'Azure AD. Selon votre profil, vous pourriez avoir accès à différentes fonctionnalités :

- **Accès en lecture seule** : Visualisation des données sans possibilité de modification
- **Accès en édition** : Possibilité de créer et modifier des contrats
- **Accès administrateur** : Fonctionnalités administratives supplémentaires
