const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const authRoutes = require('./Routes/auth');
const { execSync } = require('child_process');
const http = require('http');
const { setupShellWs } = require('./Routes/shellWs');

const app = express();
const port = 3000;
const REGISTRY_PORT = 5000; // port pour le registre

// Lancer le registre Podman local si besoin
function ensureLocalRegistry() {
    try {
        // Vérifier si un conteneur nommé 'registry' existe
        let exists = false;
        try {
            execSync('podman container exists registry');
            exists = true;
        } catch (e) {
            exists = false;
        }
        if (exists) {
            // Le conteneur existe, vérifier s'il est en cours d'exécution
            const running = execSync('podman ps --filter "name=registry" --format "{{.ID}}"').toString().trim();
            if (!running) {
                console.log('Le conteneur registry existe mais n\'est pas lancé, démarrage...');
                execSync('podman start registry');
            } else {
                console.log('Le registre Podman est déjà lancé.');
            }
        } else {
            // Le conteneur n'existe pas, on le crée
            console.log(`Lancement du registre Podman sur le port ${REGISTRY_PORT}...`);
            execSync(`podman run -d -p ${REGISTRY_PORT}:5000 --name registry registry:2`);
        }
    } catch (err) {
        console.error('Erreur lors du lancement du registre Podman :', err.message);
    }
}

ensureLocalRegistry();

// Middleware pour parser le JSON et les cookies
app.use(bodyParser.json());
app.use(cookieParser());

// Servir les fichiers statiques
app.use(express.static('public'));

// Utiliser les routes
app.use('/', routes);
app.use('/auth', authRoutes);

const server = http.createServer(app);
// Démarrer le serveur HTTP + WebSocket
server.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});

// Initialiser le WebSocket shell dans un fichier séparé
setupShellWs(server);
