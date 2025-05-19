const nodemailer = require('nodemailer');
require('dotenv').config();

// Debug: Afficher les variables d'environnement (sans le mot de passe)
console.log('Configuration email:', {
    user: process.env.EMAIL_USER,
    frontendUrl: process.env.FRONTEND_URL,
    hasPassword: !!process.env.EMAIL_PASSWORD
});

// Configuration du transporteur d'emails avec Gmail
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    auth: {
        user: "noreplytccenter@gmail.com",
        pass: "yqyb sxmx bqhw dkoz"
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Fonction pour vérifier la configuration du transporteur
async function verifyTransporter() {
    try {
        await transporter.verify();
        console.log('Configuration du transporteur d\'emails vérifiée avec succès');
        return true;
    } catch (error) {
        console.error('Erreur lors de la vérification du transporteur:', error);
        return false;
    }
}

// Fonction pour envoyer l'email de réinitialisation
async function sendResetEmail(email, token) {
    if (!email || !token) {
        console.error('Email ou token manquant');
        return false;
    }

    try {
        console.log('Tentative d\'envoi d\'email à:', email);
        
        const resetLink = `${process.env.FRONTEND_URL}/reset-password.html?token=${token}`;
        
        const mailOptions = {
            from: {
                name: 'TC Center',
                address: process.env.EMAIL_USER
            },
            to: email,
            subject: 'Réinitialisation de votre mot de passe - TC Center',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Réinitialisation de votre mot de passe</h2>
                    <p>Bonjour,</p>
                    <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous pour définir un nouveau mot de passe :</p>
                    <p style="margin: 20px 0;">
                        <a href="${resetLink}" 
                           style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            Réinitialiser mon mot de passe
                        </a>
                    </p>
                    <p>Ce lien est valable pendant 1 heure.</p>
                    <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
                    <p>Cordialement,<br>L'équipe TC Center</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email envoyé avec succès:', {
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected
        });
        return true;
    } catch (error) {
        console.error('Erreur détaillée lors de l\'envoi de l\'email:', {
            message: error.message,
            code: error.code,
            command: error.command,
            stack: error.stack
        });
        return false;
    }
}

// Vérification initiale du transporteur
verifyTransporter().catch(error => {
    console.error('Erreur lors de la vérification initiale du transporteur:', error);
});

module.exports = {
    sendResetEmail,
    verifyTransporter
}; 