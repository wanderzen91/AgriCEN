from flask_wtf import FlaskForm
from wtforms import (
    StringField, DecimalField, DateField, HiddenField, TextAreaField, 
    IntegerField, SubmitField, SelectField, SelectMultipleField, RadioField,
    ValidationError, Form
)
from wtforms.validators import DataRequired, Optional, NumberRange, Length, Email

# Validateur personnalisé pour vérifier qu'au moins un type de production est sélectionné
def at_least_one_production_type(form, field):
    """Vérifie qu'au moins un type de production (bio ou conventionnel) est sélectionné."""
    # Ce validateur sera attaché au champ type_production_bio
    # mais vérifiera aussi type_production_conv
    bio_values = form.type_production_bio.data if form.type_production_bio.data else []
    conv_values = form.type_production_conv.data if form.type_production_conv.data else []
    
    if not bio_values and not conv_values:
        raise ValidationError('Au moins un type de production (bio ou conventionnel) doit être sélectionné.')

class CombinedForm(FlaskForm):

    # Champs Contrat
    surf_contractualisee = DecimalField(
        'Surface Contractualisée (ha)', 
        validators=[
            DataRequired(), 
            NumberRange(min=0.1, max=100, message="La surface contractualisée doit être comprise entre 0.1 et 100 hectares.")
        ]
    )
    date_signature = DateField('Date de Signature', validators=[DataRequired()])
    date_fin = DateField('Date de Fin', validators=[DataRequired()])
    date_prise_effet = DateField('Date de Prise d\'Effet', validators=[DataRequired()])
    latitude = HiddenField('Latitude', validators=[Optional()])
    longitude = HiddenField('Longitude', validators=[Optional()])

    # Champs type_contrat
    appellation_contrat = SelectField(
        'Type de Contrat', 
        choices=[],  # Les choix seront définis dynamiquement
        validators=[DataRequired()],
        coerce=int  # Convertit les données soumises en `int` automatiquement
    )
    

    # Champs Société
    nom_societe = StringField('Nom de la Société', validators=[DataRequired(), Length(max=100)])
    contact = StringField('Contact', validators=[DataRequired(), Length(max=100)])
    remarques = TextAreaField('Remarques', validators=[Optional(), Length(max=300)])

    # Champs Agriculteur
    nom_agri = StringField("Nom de l'exploitant(e)", validators=[DataRequired(), Length(max=100)])
    prenom_agri = StringField("Prénom de l'exploitant(e)", validators=[DataRequired(), Length(max=50)])
    date_naissance = DateField('Date de naissance', validators=[Optional()])

    # Champs Site CEN
    nom_site = StringField('Site(s) CEN concerné(s)',validators=[DataRequired(), Length(max=100)], render_kw={"placeholder": "Saisissez le nom d'un site", "style": "background-color: #e9ecef; color: #6c757d;"})
    code_site = StringField('Code(s) site(s)', validators=[DataRequired()], render_kw={"readonly": True, "style": "background-color: #e9ecef; color: #6c757d;"})

    # Champs pour Type de Milieu
    type_milieu = SelectMultipleField(
        'Types de Milieu',
        choices=[],  # Les choix seront définis dynamiquement
        validators=[DataRequired()],
        coerce=int  # Convertit les données soumises en `int` automatiquement
    )


    # Champs pour Type de Production Bio
    type_production_bio = SelectMultipleField(
        'Types de Production Bio', 
        choices=[],  # Les choix seront définis dynamiquement
        validators=[Optional(), at_least_one_production_type],  # Validateur personnalisé
        coerce=int  # Convertit les données soumises en `int` automatiquement
    )
    
    # Champs pour Type de Production Conventionnelle
    type_production_conv = SelectMultipleField(
        'Types de Production Conventionnelle', 
        choices=[],  # Les choix seront définis dynamiquement
        validators=[Optional()],  # Optional car on peut n'avoir que du bio
        coerce=int  # Convertit les données soumises en `int` automatiquement
    )
    
    # Champs pour Mode de Production Bio
    mode_production_bio = HiddenField(
        'Mode de Production Bio',
        validators=[Optional()],  # Optional car on peut n'avoir que du conventionnel
        default=1  # Valeur fixe pour Bio
    )
    
    # Champs pour Mode de Production Conventionnelle
    mode_production_conv = HiddenField(
        'Mode de Production Conventionnelle',
        validators=[Optional()],  # Optional car on peut n'avoir que du bio
        default=2  # Valeur fixe pour Conventionnelle
    )
    
    # Gardons les champs originaux pour la compatibilité avec le code existant
    # mais rendons-les optionnels
    type_production = SelectMultipleField(
        'Types de Production', 
        choices=[],  # Les choix seront définis dynamiquement
        validators=[Optional()],
        coerce=int  # Convertit les données soumises en `int` automatiquement
    )
    
    mode_production = SelectField(
        'Mode de Production',
        choices=[],  # Les choix seront définis dynamiquement
        validators=[Optional()],
        coerce=int  # Convertit les données soumises en int automatiquement
    )
    
    # Champs pour Produits Finis
    produit_fini = SelectMultipleField(
        'Produits Finis', 
        choices=[],  # Les choix seront définis dynamiquement
        validators=[DataRequired()],
        coerce=int  # Convertit les données soumises en `int` automatiquement
    )

    # Champs pour Referent
    nom_referent = StringField('Nom de la personne référente', validators=[DataRequired(), Length(max=100)])
    prenom_referent = StringField('Prénom de la personne référente', validators=[DataRequired(), Length(max=50)])


    siret = StringField(
        "Numéro SIRET",
        validators=[
            DataRequired(message="Le numéro SIRET est requis."),
            Length(min=14, max=14, message="Le numéro SIRET doit contenir exactement 14 chiffres.")
        ]
    )
    adresse_etablissement = StringField(
        "Adresse complète de l'établissement",
        validators=[Optional(), Length(max=200)]
    )
    tranche_effectif = StringField(
        "Tranche d'effectif salarié de l'établissement",
        validators=[Optional(), Length(max=50)]
    )
    categorie_juridique = StringField(
        "Catégorie juridique",
        validators=[Optional(), Length(max=100)]
    )
    activite_principale = StringField(
        "Activité principale",
        validators=[Optional(), Length(max=100)]
    )

    fetch_sirene = SubmitField('Rechercher via l''API de l''INSEE')
    submit = SubmitField('Enregistrer les données')