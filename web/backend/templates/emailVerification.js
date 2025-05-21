// Templates HTML pour la vérification d'email

const styles = `
    body {
        font-family: Arial, sans-serif;
        background-color: #f3f4f6;
        margin: 0;
        padding: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
    }
    .container {
        background-color: white;
        padding: 2rem;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        text-align: center;
        max-width: 500px;
        width: 90%;
    }
    .icon {
        font-size: 48px;
        margin-bottom: 1rem;
    }
    .success-icon {
        color: #10b981;
    }
    .error-icon {
        color: #ef4444;
    }
    .warning-icon {
        color: #f59e0b;
    }
    h1 {
        color: #1f2937;
        margin-bottom: 1rem;
    }
    p {
        color: #4b5563;
        margin-bottom: 1.5rem;
    }
    .button {
        display: inline-block;
        background-color: #2563eb;
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 4px;
        text-decoration: none;
        transition: background-color 0.2s;
    }
    .button:hover {
        background-color: #1d4ed8;
    }
`;

const baseTemplate = (title, icon, message, buttonText = 'Retour à l\'accueil', buttonLink = '/') => `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - TC Center</title>
        <style>${styles}</style>
    </head>
    <body>
        <div class="container">
            <div class="icon ${icon}">${icon === 'success-icon' ? '✅' : icon === 'error-icon' ? '❌' : '⚠️'}</div>
            <h1>${title}</h1>
            <p>${message}</p>
            <a href="${buttonLink}" class="button">${buttonText}</a>
        </div>
    </body>
    </html>
`;

const templates = {
    success: (email) => baseTemplate(
        'Email vérifié avec succès !',
        'success-icon',
        `Votre adresse email ${email} a été vérifiée avec succès. Vous pouvez maintenant vous connecter à votre compte.`,
        'Se connecter',
        '/'
    ),

    missingToken: baseTemplate(
        'Erreur de vérification',
        'error-icon',
        'Le lien de vérification est invalide ou incomplet.'
    ),

    expiredToken: baseTemplate(
        'Lien expiré',
        'warning-icon',
        'Le lien de vérification a expiré ou est invalide.'
    ),

    error: baseTemplate(
        'Une erreur est survenue',
        'error-icon',
        'Une erreur s\'est produite lors de la vérification de votre email. Veuillez réessayer plus tard.'
    )
};

module.exports = templates; 