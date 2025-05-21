const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/init'); // ou le chemin correct vers ta base SQLite
const authenticateToken = require('../middleware/authenticate');
const { JWT_SECRET } = require('../utils/jwt');
const { sendResetEmail, sendVerificationEmail } = require('../config/email');

// Enregistrement d'un nouvel utilisateur
router.post('/register', async (req, res) => {
    const { email, username, password } = req.body;
    console.log('Tentative d\'inscription pour:', { email, username });

    if (!email || !username || !password) {
        console.log('Champs manquants:', { email: !!email, username: !!username, password: !!password });
        return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    try {
        // Vérifier si l'email ou le username est déjà utilisé
        const existingUser = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (existingUser) {
            if (existingUser.email === email) {
                return res.status(400).json({ message: 'Cet email est déjà utilisé' });
            } else {
                return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà utilisé' });
            }
        }

        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Générer le token de vérification
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Insérer le nouvel utilisateur
        const result = await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (username, email, password, verification_token, is_verified) VALUES (?, ?, ?, ?, 0)',
                [username, email, hashedPassword, verificationToken],
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });

        // Envoyer l'email de vérification
        const emailSent = await sendVerificationEmail(email, verificationToken);
        if (!emailSent) {
            return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email de vérification' });
        }

        res.status(201).json({ message: 'Inscription réussie. Veuillez vérifier votre email.' });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ message: 'Erreur lors de l\'inscription' });
    }
});

// Connexion utilisateur
router.post('/login', async (req, res) => {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
        return res.status(400).json({ message: 'Identifiants requis' });
    }

    try {
        // Vérifier si l'utilisateur existe
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ? OR username = ?', [identifier, identifier], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!user) {
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }

        // Vérifier si l'email est vérifié
        if (!user.is_verified) {
            return res.status(403).json({ message: 'Veuillez vérifier votre adresse email avant de vous connecter.' });
        }

        // Vérifier le mot de passe
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Identifiants incorrects' });
        }

        // Créer le token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Mettre à jour la session
        await new Promise((resolve, reject) => {
            db.run('DELETE FROM sessions WHERE user_id = ?', [user.id], (err) => {
                if (err) reject(err);
                db.run(
                    'INSERT INTO sessions (user_id, token, username) VALUES (?, ?, ?)',
                    [user.id, token, user.username],
                    (err) => {
                        if (err) reject(err);
                        resolve();
                    }
                );
            });
        });

        // Définir le cookie
        res.cookie('token', token, {
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 86400000
        });

        res.status(200).json({
            message: 'Connexion réussie',
            user: { id: user.id, email: user.email, username: user.username }
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
});

// Vérification de l'email
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    console.log('Tentative de vérification avec le token:', token);

    if (!token) {
        console.log('Token manquant');
        return res.status(400).json({ message: 'Token manquant' });
    }

    try {
        // Vérifier le token
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT id FROM users WHERE verification_token = ?', [token], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });

        if (!user) {
            console.log('Token invalide ou expiré');
            return res.status(400).json({ message: 'Lien invalide ou expiré' });
        }

        // Mettre à jour le statut de vérification
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?',
                [user.id],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });

        console.log('Email vérifié avec succès pour l\'utilisateur:', user.id);
        res.status(200).json({ message: 'Adresse email vérifiée avec succès !' });
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'email:', error);
        res.status(500).json({ message: 'Erreur lors de la vérification de l\'email' });
    }
});

// Export du routeur
module.exports = router;

router.post('/logout', authenticateToken, (req, res) => {
    const token = req.cookies.token;
    
    db.run('DELETE FROM sessions WHERE token = ?', [token], (err) => {
        if (err) {
            return res.status(500).json({ message: 'Erreur lors de la déconnexion' });
        }
        // Supprimer le cookie
        res.clearCookie('token');
        res.status(200).json({ message: 'Déconnexion réussie' });
    });
});
  
  // Route pour ajouter un utilisateur (gardée pour compatibilité)
  router.post('/addUser', (req, res) => {
      const { username, password } = req.body;
  
      if (!username || !password) {
        return res.status(400).send('Champs requis manquants');
      }
  
    
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return res.status(500).send(err.message);
        }
    
        db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hash], function(err) {
          if (err) {
            return res.status(500).send(err.message);
          }
          res.status(200).send({ id: this.lastID });
        });
      });
    });

// Route pour vérifier l'authentification
router.get('/check', authenticateToken, (req, res) => {
    res.status(200).json({ 
        message: 'Authentifié',
        user: {
            id: req.user.id,
            username: req.user.username,
            email: req.user.email
        }
    });
});

// Route pour demander la réinitialisation du mot de passe
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    console.log('Tentative de réinitialisation pour:', email);

    if (!email) {
        console.log('Email manquant');
        return res.status(400).json({ message: 'Email requis' });
    }

    // Vérifier si l'email existe
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error('Erreur lors de la vérification de l\'email:', err);
            return res.status(500).json({ message: 'Erreur lors de la vérification de l\'email' });
        }

        if (!user) {
            console.log('Aucun utilisateur trouvé avec cet email');
            // Pour des raisons de sécurité, on renvoie toujours un succès
            return res.status(200).json({ message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation' });
        }

        console.log('Utilisateur trouvé:', user.id);

        try {
            // Générer un token de réinitialisation
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenExpiry = Date.now() + 3600000; // 1 heure

            console.log('Token généré:', resetToken);

            // Vérifier si les colonnes existent
            db.get("PRAGMA table_info(users)", [], (err, rows) => {
                if (err) {
                    console.error('Erreur lors de la vérification de la structure de la table:', err);
                    return res.status(500).json({ message: 'Erreur lors de la vérification de la structure de la table' });
                }
                console.log('Structure de la table:', rows);
            });

            // Sauvegarder le token dans la base de données
            const query = 'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?';
            console.log('Requête SQL:', query);
            console.log('Paramètres:', [resetToken, resetTokenExpiry, user.id]);

            db.run(query, [resetToken, resetTokenExpiry, user.id], async function(err) {
                if (err) {
                    console.error('Erreur lors de la sauvegarde du token:', err);
                    console.error('Détails de l\'erreur:', err.message);
                    return res.status(500).json({ 
                        message: 'Erreur lors de la sauvegarde du token',
                        details: err.message
                    });
                }

                console.log('Token sauvegardé avec succès');
                console.log('Nombre de lignes modifiées:', this.changes);

                // Vérifier que le token a bien été sauvegardé
                db.get('SELECT reset_token, reset_token_expiry FROM users WHERE id = ?', [user.id], (err, result) => {
                    if (err) {
                        console.error('Erreur lors de la vérification du token:', err);
                    } else {
                        console.log('Token sauvegardé dans la base:', result);
                    }
                });

                // Envoyer l'email
                const emailSent = await sendResetEmail(email, resetToken);
                if (!emailSent) {
                    console.error('Erreur lors de l\'envoi de l\'email');
                    return res.status(500).json({ message: 'Erreur lors de l\'envoi de l\'email' });
                }

                console.log('Email envoyé avec succès');
                res.status(200).json({ message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation' });
            });
        } catch (error) {
            console.error('Erreur inattendue:', error);
            return res.status(500).json({ 
                message: 'Erreur inattendue',
                details: error.message
            });
        }
    });
});

// Route pour réinitialiser le mot de passe
router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;

    if (!token || !password) {
        return res.status(400).json({ message: 'Token et mot de passe requis' });
    }

    // Vérifier le token et son expiration
    db.get(
        'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?',
        [token, Date.now()],
        async (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Erreur lors de la vérification du token' });
            }

            if (!user) {
                return res.status(400).json({ message: 'Token invalide ou expiré' });
            }

            // Hacher le nouveau mot de passe
            bcrypt.hash(password, 10, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).json({ message: 'Erreur lors du hachage du mot de passe' });
                }

                // Mettre à jour le mot de passe et effacer le token
                db.run(
                    'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
                    [hashedPassword, user.id],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ message: 'Erreur lors de la mise à jour du mot de passe' });
                        }

                        res.status(200).json({ message: 'Mot de passe réinitialisé avec succès' });
                    }
                );
            });
        }
    );
});

// Route temporaire pour vérifier les utilisateurs (à supprimer en production)
router.get('/check-users', (req, res) => {
    db.all('SELECT id, email, username FROM users', [], (err, rows) => {
        if (err) {
            console.error('Erreur lors de la récupération des utilisateurs:', err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des utilisateurs' });
        }
        res.json(rows);
    });
});

module.exports = router;
