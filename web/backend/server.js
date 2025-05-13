const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const { execSync } = require('child_process');
const http = require('http');
const WebSocket = require('ws');
const os = require('os');
const pty = require('node-pty');

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

// Middleware pour parser le JSON
app.use(bodyParser.json());

// Servir les fichiers statiques
app.use(express.static('public'));

// Utiliser les routes
app.use('/', routes);

const server = http.createServer(app);
// Démarrer le serveur HTTP + WebSocket
server.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});

const wss = new WebSocket.Server({ server, path: '/ws/exec' });

wss.on('connection', (ws, req) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const namespace = url.searchParams.get('namespace');
    const release = url.searchParams.get('release');
    if (!namespace || !release) {
        ws.send('Namespace ou release manquant.');
        ws.close();
        return;
    }

    // Récupérer le nom du pod
    const getPodCmd = `kubectl get pods -n ${namespace} -l app=${release} -o jsonpath='{.items[0].metadata.name}'`;
    const getPod = pty.spawn('sh', ['-c', getPodCmd], {
        name: 'xterm-color',
        cols: 80,
        rows: 24,
        cwd: process.cwd(),
        env: { ...process.env, KUBECONFIG: '/etc/rancher/k3s/k3s.yaml' }
    });

    let podName = '';
    getPod.onData(data => {
        podName += data;
    });

    getPod.onExit(() => {
        podName = podName.replace(/'/g, '').trim();
        console.log('Nom final du pod:', podName);
        
        if (!podName) {
            ws.send('Aucun pod trouvé pour cette release.');
            ws.close();
            return;
        }

        // Lancer kubectl exec avec PTY
        const shell = pty.spawn('kubectl', [
            'exec',
            '-n', namespace,
            '-it',
            podName,
            '--',
            'sh'
        ], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd: process.cwd(),
            env: { ...process.env, KUBECONFIG: '/etc/rancher/k3s/k3s.yaml' }
        });

        shell.onData(data => {
            ws.send(data);
        });

        ws.on('message', msg => {
            shell.write(msg);
        });

        shell.onExit(() => {
            console.log('Shell fermé');
            ws.close();
        });

        ws.on('close', () => {
            console.log('WebSocket fermé, arrêt du shell');
            shell.kill();
        });
    });
});
