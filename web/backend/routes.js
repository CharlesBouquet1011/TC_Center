const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const { deployRouter, undeployRouter } = require('./deployer');
const portInfoRouter = require('./portinfo');
const { execCommand } = require('./k3sExec');

// Connection à la base de données
const db = new sqlite3.Database('./users.db');

// Création de la table si elle n'existe pas
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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

// Nouvelle route pour lister les releases Helm d'un namespace
router.get('/releases', async (req, res) => {
    const { namespace } = req.query;
    if (!namespace) {
        return res.status(400).json({ error: 'Namespace requis' });
    }

    try {
        // Définir KUBECONFIG avant d'exécuter helm
        process.env.KUBECONFIG = '/etc/rancher/k3s/k3s.yaml';
        const output = await execCommand(`helm list -n ${namespace} -o json`);
        const releases = JSON.parse(output);
        res.json(releases);
    } catch (err) {
        res.status(500).json({ error: 'Erreur lors de la récupération des releases', details: err.toString() });
    }
});

// Route pour la connexion
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email et mot de passe requis' });
  }

  // Vérifier si l'utilisateur existe
  db.get('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, row) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la connexion' });
    }

    if (row) {
      // Connexion réussie
      res.status(200).json({ 
        message: 'Connexion réussie',
        user: {
          email: row.email
        }
      });
    } else {
      res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
  });
});

// Route pour ajouter un utilisateur (gardée pour la compatibilité)
router.post('/addUser', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).send('Champs requis manquants');
  }

  db.run(`INSERT INTO users (email, password) VALUES (?, ?)`, [username, password], function(err) {
    if (err) {
      return res.status(500).send(err.message);
    }
});
});
module.exports = router;