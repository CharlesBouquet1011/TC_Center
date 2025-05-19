const WebSocket = require('ws');
const pty = require('node-pty');

function setupShellWs(server) {
    const wss = new WebSocket.Server({ server, path: '/ws/exec' });

    wss.on('connection', (ws, req) => {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const namespace = url.searchParams.get('namespace');
        const podName = url.searchParams.get('release');
        if (!namespace || !podName) {
            ws.send('Namespace ou nom de pod manquant.');
            ws.close();
            return;
        }

        console.log(`Ouverture d'un terminal pour le pod ${podName} dans ${namespace}`);

        // Lancer kubectl exec directement avec le nom du pod
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
}

module.exports = { setupShellWs }; 