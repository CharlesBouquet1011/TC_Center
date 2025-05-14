const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/init'); // ou le chemin correct vers ta base SQLite
const authenticateToken = require('../middleware/authenticate');
const { JWT_SECRET } = require('../utils/jwt');

router.post('/register', (req, res) => {
    const { email, username, password } = req.body;
    console.log('Tentative d\'inscription pour:', { email, username });
  
    if (!email || !username || !password) {
      console.log('Champs manquants:', { email: !!email, username: !!username, password: !!password });
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }
  
    // Vérifier si l'email ou le username est déjà utilisé
    db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
      if (err) {
        console.error('Erreur lors de la vérification des identifiants:', err);
        return res.status(500).json({ message: 'Erreur lors de la vérification des identifiants' });
      }
  
      if (row) {
        console.log('Utilisateur existant trouvé:', row);
        if (row.email === email) {
          return res.status(400).json({ message: 'Cet email est déjà utilisé' });
        } else {
          return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà utilisé' });
        }
      }
  
      // Hacher le mot de passe avant de l'enregistrer
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Erreur lors du hachage du mot de passe:', err);
          return res.status(500).json({ message: 'Erreur lors du hachage du mot de passe' });
        }
  
        console.log('Mot de passe haché avec succès');
  
        // Ajouter le nouvel utilisateur avec le mot de passe haché
        db.run(
          'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
          [username, email, hashedPassword],
          function(err) {
            if (err) {
              console.error('Erreur lors de l\'insertion dans la base de données:', err);
              return res.status(500).json({ message: 'Erreur lors de l\'inscription' });
            }
            console.log('Utilisateur créé avec succès, ID:', this.lastID);
            res.status(201).json({ message: 'Inscription réussie' });
          }
        );
      });
    });
  });
  
  // Route pour la connexion
  router.post('/login', (req, res) => {
    const { identifier, password } = req.body;
  
    if (!identifier || !password) {
      return res.status(400).json({ message: 'Identifiants requis' });
    }
  
    // Vérifier si l'utilisateur existe (par email ou username)
    db.get(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [identifier, identifier],
      (err, row) => {
        if (err) {
          return res.status(500).json({ message: 'Erreur lors de la connexion' });
        }
  
        if (!row) {
          return res.status(401).json({ message: 'Identifiants incorrects' });
        }
  
        // Vérifier le mot de passe haché
        bcrypt.compare(password, row.password, (err, isMatch) => {
          if (err) {
            return res.status(500).json({ message: 'Erreur lors de la vérification du mot de passe' });
          }
  
          if (!isMatch) {
            return res.status(401).json({ message: 'Identifiants incorrects' });
          }

          // Créer un token JWT
          const token = jwt.sign(
            { 
              id: row.id,
              username: row.username,
              email: row.email,
              createdAt: new Date().toISOString()
            },
            JWT_SECRET,
            { expiresIn: '24h' }
          );

          // Supprimer les anciennes sessions
          db.run('DELETE FROM sessions WHERE user_id = ?', [row.id], (err) => {
            if (err) {
              console.error('Erreur lors de la suppression des anciennes sessions:', err);
            }

            // Créer une nouvelle session avec le username
            db.run(
              'INSERT INTO sessions (user_id, token, username) VALUES (?, ?, ?)',
              [row.id, token, row.username],
              (err) => {
                if (err) {
                  console.error('Erreur lors de l\'enregistrement de la session:', err);
                  return res.status(500).json({ message: 'Erreur lors de la création de la session' });
                }

                // Définir le cookie avec le token
                res.cookie('token', token, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production', // true en production
                  sameSite: 'strict',
                  maxAge: 24 * 60 * 60 * 1000 // 24 heures
                });

                res.status(200).json({
                  message: 'Connexion réussie',
                  user: {
                    id: row.id,
                    email: row.email,
                    username: row.username
                  }
                });
              }
            );
          });
        });
      }
    );
  });

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
  
    
      bcrypt.hash(password, saltRounds, (err, hash) => {
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

module.exports = router;
