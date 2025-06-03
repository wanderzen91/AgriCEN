from flask import Flask, redirect, request, session, url_for, render_template, flash
from flask_login import LoginManager, UserMixin, login_user, logout_user, current_user, login_required
import msal
from config import Config
import uuid
import requests

login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.login_message = 'Veuillez vous connecter pour accéder à cette page.'
login_manager.login_message_category = 'info'

class User(UserMixin):
    def __init__(self, id, name, email, token=None):
        self.id = id
        self.name = name
        self.email = email
        self.token = token

    @staticmethod
    def get_user_from_token(token):
        """Récupère les informations de l'utilisateur à partir du token"""
        graph_data = requests.get(
            'https://graph.microsoft.com/v1.0/me',
            headers={'Authorization': f'Bearer {token}'},
        ).json()
        
        return User(
            id=graph_data.get('id'),
            name=graph_data.get('displayName'),
            email=graph_data.get('userPrincipalName'),
            token=token
        )

@login_manager.user_loader
def load_user(user_id):
    """Charge l'utilisateur à partir de la session"""
    if 'user' not in session:
        return None
    
    user_data = session['user']
    if user_data.get('id') != user_id:
        return None
    
    return User(
        id=user_data.get('id'),
        name=user_data.get('name'),
        email=user_data.get('email'),
        token=user_data.get('token')
    )

def _build_msal_app(cache=None):
    """Construit l'application MSAL pour l'authentification"""
    return msal.ConfidentialClientApplication(
        Config.CLIENT_ID,
        authority=Config.AUTHORITY,
        client_credential=Config.CLIENT_SECRET,
        token_cache=cache
    )

def _build_auth_url(authority=None, scopes=None, state=None):
    """Construit l'URL d'authentification"""
    return _build_msal_app().get_authorization_request_url(
        scopes or Config.SCOPE,
        state=state or str(uuid.uuid4()),
        redirect_uri=url_for('auth_callback', _external=True, scheme='https')
    )

def _get_token_from_code(code):
    """Récupère le token à partir du code d'autorisation"""
    result = _build_msal_app().acquire_token_by_authorization_code(
        code,
        scopes=Config.SCOPE,
        redirect_uri=url_for('auth_callback', _external=True, scheme='https')
    )
    return result

def init_auth(app):
    """Initialise l'authentification pour l'application"""
    login_manager.init_app(app)
    
    @app.route('/login')
    def login():
        """Page de connexion"""
        if current_user.is_authenticated:
            return redirect(url_for('map_page'))
        
        # Génère l'URL d'authentification Microsoft
        auth_url = _build_auth_url()
        return render_template('login.html', auth_url=auth_url)
    
    @app.route('/auth/callback')
    def auth_callback():
        """Callback après authentification Microsoft"""
        if request.args.get('error'):
            flash(f"Erreur lors de l'authentification: {request.args.get('error_description')}", 'danger')
            return redirect(url_for('login'))
        
        if request.args.get('code'):
            # Récupère le token à partir du code
            result = _get_token_from_code(request.args.get('code'))
            
            if 'error' in result:
                flash(f"Erreur lors de l'authentification: {result.get('error_description')}", 'danger')
                return redirect(url_for('login'))
            
            # Récupère les informations de l'utilisateur
            token = result.get('access_token')
            user = User.get_user_from_token(token)
            
            # Sauvegarde l'utilisateur dans la session
            session['user'] = {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'token': token
            }
            
            # Connecte l'utilisateur
            login_user(user)
            
            # Redirige vers la page demandée ou la page d'accueil
            next_page = session.get('next', url_for('map_page'))
            session.pop('next', None)
            return redirect(next_page)
        
        return redirect(url_for('login'))
    
    @app.route('/logout')
    def logout():
        """Déconnexion"""
        logout_user()
        session.clear()
        return redirect(url_for('login'))
    
    @app.before_request
    def store_next():
        """Stocke la page demandée pour redirection après authentification"""
        if request.path == '/login' and request.args.get('next'):
            session['next'] = request.args.get('next')
