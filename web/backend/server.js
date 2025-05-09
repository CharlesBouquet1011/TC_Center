const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');

const app = express();
const port = 3000;

// Middleware pour parser le JSON
app.use(bodyParser.json());

// Servir les fichiers statiques
app.use(express.static('public'));

// Utiliser les routes
app.use('/', routes);

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
