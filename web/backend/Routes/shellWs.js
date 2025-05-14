const WebSocket = require('ws');
const pty = require('node-pty');

function setupShellWs(server) {
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
}

module.exports = { setupShellWs }; 