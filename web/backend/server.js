const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const routes = require('./routes');
const authRoutes = require('./Routes/auth');
const { execSync } = require('child_process');
const http = require('http');
const { setupShellWs } = require('./Routes/shellWs');
const db = require('./db/init');
const emailTemplates = require('./templates/emailVerification');

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
app.use('/api/auth', authRoutes);

// Route de vérification d'email
app.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    console.log('Tentative de vérification avec le token:', token);

    if (!token) {
        return res.send(emailTemplates.missingToken);
    }

    try {
        // Vérifier le token
        const user = await new Promise((resolve, reject) => {
            db.get('SELECT id, email FROM users WHERE verification_token = ?', [token], (err, row) => {
                if (err) {
                    console.error('Erreur lors de la recherche du token:', err);
                    reject(err);
                }
                resolve(row);
            });
        });

        if (!user) {
            return res.send(emailTemplates.expiredToken);
        }

        console.log('Utilisateur trouvé:', user);

        // Mettre à jour le statut de vérification
        await new Promise((resolve, reject) => {
            db.run(
                'UPDATE users SET is_verified = 1, verification_token = NULL WHERE id = ?',
                [user.id],
                function(err) {
                    if (err) {
                        console.error('Erreur lors de la mise à jour du statut:', err);
                        reject(err);
                    }
                    console.log('Nombre de lignes modifiées:', this.changes);
                    resolve();
                }
            );
        });

        console.log('Email vérifié avec succès pour l\'utilisateur:', user.id);
        res.send(emailTemplates.success(user.email));
    } catch (error) {
        console.error('Erreur détaillée lors de la vérification de l\'email:', error);
        res.send(emailTemplates.error);
    }
});

const server = http.createServer(app);
// Démarrer le serveur HTTP + WebSocket
server.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});

// Initialiser le WebSocket shell dans un fichier séparé
setupShellWs(server);
