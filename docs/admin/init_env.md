# Configuration du fichier `.env`

Voici la configuration requise pour le fichier `.env` de l'application :

```env
PORT=NUMERO_DU_PORT
PUID=NUMERO_DU_PUID
PGID=NUMERO_DU_PGID

JWT_SECRET=cle_secrete_tres_securisee

EMAIL_USER=adresse_email_google@gmail.com
EMAIL_PASSWORD=mot_de_passe_application_google

FRONTEND_URL=url_du_site
```

---

# Configuration de l’adresse email Google

Pour utiliser une adresse Gmail comme expéditeur sécurisé, suivez ces étapes :

1. Créez une nouvelle adresse Gmail (ou utilisez une adresse existante).
2. Activez la **vérification en deux étapes** sur ce compte Gmail.
3. Rendez-vous sur le site [https://myaccount.google.com/](https://myaccount.google.com/).
4. Dans la barre de recherche en haut, tapez **"Mots de passe des applications"**.
5. Sélectionnez le résultat correspondant pour accéder à la gestion des mots de passe d’application.
6. Cliquez sur **"Sélectionner une application"**, nommez-la (par exemple, "TC Center").
7. Google générera un mot de passe spécifique à cette application.
8. Copiez ce mot de passe et collez-le dans la variable `EMAIL_PASSWORD` du fichier `.env`.
9. Dans `EMAIL_USER`, renseignez l’adresse Gmail utilisée.

> ⚠️ Ce mot de passe est spécifique à l’application et doit être gardé secret.

---

> **Note importante** : Ne partagez jamais votre fichier `.env` publiquement, car il contient des informations sensibles comme des clés secrètes et mots de passe.
