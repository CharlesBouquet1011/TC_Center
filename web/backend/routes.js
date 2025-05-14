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
    process.env.KUBECONFIG = '/etc/rancher/k3s/k3s.yaml';
    const output = await execCommand(`helm list -n ${namespace} -o json`);
    const releases = JSON.parse(output);
    res.json(releases);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération des releases', details: err.toString() });
  }
});

// Route pour describe k3s
router.get('/describe-k3s', async (req, res) => {
  const { resourceType, resourceName, namespace } = req.query;
  
  if (!resourceType || !resourceName) {
    return res.status(400).json({ error: 'Type de ressource et nom de ressource requis' });
  }

  try {
    process.env.KUBECONFIG = '/etc/rancher/k3s/k3s.yaml';
    let command = `kubectl describe ${resourceType} ${resourceName}`;
    
    if (namespace) {
      command += ` -n ${namespace}`;
    }
    
    const output = await execCommand(command);
    res.type('text/plain').send(output);
  } catch (err) {
    res.status(500).send('Erreur lors de la récupération des informations : ' + err);
  }
});

// Route pour récupérer les ressources d'un type spécifique
router.get('/api-resources', async (req, res) => {
  const { resourceType, namespace } = req.query;
  
  if (!resourceType || !namespace) {
    return res.status(400).json({ error: 'Type de ressource et namespace requis' });
  }

  try {
    process.env.KUBECONFIG = '/etc/rancher/k3s/k3s.yaml';
    // Récupérer tous les objets de ce type dans le namespace
    const command = `kubectl get ${resourceType} -n ${namespace} -o json`;
    const output = await execCommand(command);
    const resources = JSON.parse(output);
    
    if (resources && resources.items) {
      const resourcesList = resources.items.map(item => ({
        name: item.metadata.name,
        namespace: item.metadata.namespace
      }));
      res.json(resourcesList);
    } else {
      res.json([]);
    }
  } catch (err) {
    res.status(404).json({ error: 'Ressources non trouvées', details: err.toString() });
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

// Route pour récupérer les logs d'un pod principal d'une release
router.get('/logs', async (req, res) => {
  const { namespace, release } = req.query;
  if (!namespace || !release) {
    return res.status(400).send('Namespace ou release manquant');
  }
  try {
    process.env.KUBECONFIG = '/etc/rancher/k3s/k3s.yaml';
    // Récupérer le nom du pod principal
    const getPodCmd = `kubectl get pods -n ${namespace} -l app=${release} -o jsonpath='{.items[0].metadata.name}'`;
    let podName = await execCommand(getPodCmd);
    podName = podName.replace(/'/g, '').trim();
    if (!podName) {
      return res.status(404).send('Aucun pod trouvé pour cette release');
    }
    // Récupérer les logs
    const logs = await execCommand(`kubectl logs -n ${namespace} ${podName}`);
    res.type('text/plain').send(logs);
  } catch (err) {
    res.status(500).send('Erreur lors de la récupération des logs : ' + err);
  }
});

// Route pour récupérer les statistiques d'un pod
router.get('/pod-stats', async (req, res) => {
  const { namespace, podName } = req.query;
  
  if (!namespace || !podName) {
    return res.status(400).json({ error: 'Namespace et nom du pod requis' });
  }
  
  try {
    process.env.KUBECONFIG = '/etc/rancher/k3s/k3s.yaml';
    
    // Récupérer l'état et les redémarrages du pod
    const podStatusCmd = `kubectl get pod ${podName} -n ${namespace} -o jsonpath='{.status.phase}{","}{.status.containerStatuses[0].restartCount}'`;
    const statusOutput = await execCommand(podStatusCmd);
    const [status, restarts] = statusOutput.split(',');
    
    // Récupérer l'utilisation CPU et mémoire (via top pod)
    let cpuUsage = 'N/A';
    let memoryUsage = 'N/A';
    
    try {
      // Cette commande peut échouer si metrics-server n'est pas installé
      const metricsCmd = `kubectl top pod ${podName} -n ${namespace} --no-headers`;
      const metricsOutput = await execCommand(metricsCmd);
      const metrics = metricsOutput.trim().split(/\s+/);
      
      if (metrics.length >= 3) {
        cpuUsage = metrics[1];
        memoryUsage = metrics[2];
      }
    } catch (topErr) {
      console.warn('Erreur lors de la récupération des métriques:', topErr);
      // On continue sans les métriques
    }
    
    res.json({
      name: podName,
      status: status || 'Inconnu',
      restarts: restarts || '0',
      cpu: cpuUsage,
      memory: memoryUsage
    });
  } catch (err) {
    res.status(500).json({ 
      error: 'Erreur lors de la récupération des statistiques du pod', 
      details: err.toString() 
    });
  }
});

module.exports = router;
