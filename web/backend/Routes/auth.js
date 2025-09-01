const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db/init'); // ou le chemin correct vers ta base SQLite
const authenticateToken = require('../middleware/authenticate');
const { JWT_SECRET } = require('../utils/jwt');
// Configuration email supprimée - plus de reset password par email

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

        // Insérer le nouvel utilisateur
        const result = await new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (username, email, password, is_verified) VALUES (?, ?, ?, 1)',
                [username, email, hashedPassword],
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });

        res.status(201).json({ message: 'Inscription réussie. Vous pouvez maintenant vous connecter.' });
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

        // L'utilisateur est automatiquement vérifié lors de l'inscription

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

// Route supprimée - plus de vérification d'email nécessaire

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

// Route de réinitialisation de mot de passe supprimée - plus d'envoi d'email

// Route de reset password supprimée - plus d'envoi d'email

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
