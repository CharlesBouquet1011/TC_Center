import defaultEnv from '../../default.env';
const nodemailer = require('nodemailer');

// Configuration du transporteur d'emails avec Mailtrap
// Pour obtenir les identifiants :
// 1. Créez un compte sur mailtrap.io
// 2. Allez dans Email Testing > Inboxes
// 3. Cliquez sur SMTP Settings
// 4. Sélectionnez Nodemailer
// 5. Copiez les identifiants ci-dessous
const transporter = nodemailer.createTransport({
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: defaultEnv.mail, // Remplacez par votre user Mailtrap
        pass: defaultEnv.password  // Remplacez par votre pass Mailtrap
    }
});

// Fonction pour envoyer l'email de réinitialisation
async function sendResetEmail(email, token) {
    try {
        console.log('Tentative d\'envoi d\'email à:', email);
        
        const resetLink = `http://localhost:3000/reset-password.html?token=${token}`;
        
        const mailOptions = {
            from: '"TC Center" <noreply@tccenter.com>',
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
        console.log('Email envoyé avec succès:', info.response);
        return true;
    } catch (error) {
        console.error('Erreur lors de l\'envoi de l\'email:', error);
        return false;
    }
}

module.exports = {
    sendResetEmail
}; 