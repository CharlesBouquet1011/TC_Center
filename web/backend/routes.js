const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { deployRouter, undeployRouter } = require('./deployer');
const portInfoRouter = require('./portinfo');
const { execCommand } = require('./k3sExec');
const bcrypt = require('bcrypt');


// Connexion à la base de données
const db = new sqlite3.Database('./users.db');

// Création de la table si elle n'existe pas
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Route pour le déploiement
router.use('/deploy', deployRouter);

// Route pour la suppression
router.use('/undeploy', undeployRouter);

// Route pour les informations de port
router.use('/ports', portInfoRouter);

// Route pour lister les releases Helm d'un namespace
router.get('/releases', async (req, res) => {
  const { namespace } = req.query;
  if (!namespace) {
    return res.status(400).json({ error: 'Namespace requis' });
  }

  try {
    const output = await execCommand(`helm list -n ${namespace} -o json`);
    const releases = JSON.parse(output);
    res.json(releases);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des releases', details: err.toString() });
  }
});

// Route pour l'inscription
router.post('/register', (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  // Vérifier si l'email ou le username est déjà utilisé
  db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la vérification des identifiants' });
    }

    if (row) {
      if (row.email === email) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      } else {
        return res.status(400).json({ message: 'Ce nom d\'utilisateur est déjà utilisé' });
      }
    }

    // Hacher le mot de passe avant de l'enregistrer
    bcrypt.hash(password, 10, (err, hashedPassword) => {
      if (err) {
        return res.status(500).json({ message: 'Erreur lors du hachage du mot de passe' });
      }

      // Ajouter le nouvel utilisateur avec le mot de passe haché
      db.run(
        'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword],
        function(err) {
          if (err) {
            return res.status(500).json({ message: 'Erreur lors de l\'inscription' });
          }
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

        // Connexion réussie
        res.status(200).json({
          message: 'Connexion réussie',
          user: {
            email: row.email,
            username: row.username
          }
        });
      });
    }
  );
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

module.exports = router;
