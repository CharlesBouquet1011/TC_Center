#!/bin/sh

# === CONFIGURATION ===
ROLE=$(systemd-ask-password --echo "Quel rôle pour ce nœud ? (master/agent)")

# =======================

echo "INFO: Récupération k3s"
echo ""
curl -sfL https://get.k3s.io -o ./install-k3s.sh
chmod +x ./install-k3s.sh

echo "INFO: Installation k3s en tant que ($ROLE)"
if [ "$ROLE" = "master" ]; then
    
    INSTALL_K3S_SKIP_ENABLE=true \
    INSTALL_K3S_EXEC="--snapshotter=fuse-overlayfs" \
    ./install-k3s.sh

elif [ "$ROLE" = "agent" ]; then
    MASTER_IP=$(systemd-ask-password --echo "IP du serveur master :")
    NODE_TOKEN=$(systemd-ask-password --echo "Token du nœud :") #on le trouve côté master dans /var/lib/rancher/k3s/server/node-token
    if [ -z "$MASTER_IP" ]; then
        echo "ERREUR: MASTER_IP n'est pas défini."
        exit 1
    fi

    if [ -z "$NODE_TOKEN" ]; then
        echo "ERREUR: NODE_TOKEN n'est pas défini."
        exit 1
    fi

    INSTALL_K3S_SKIP_ENABLE=true \
    K3S_URL="https://$MASTER_IP:6443" \
    K3S_TOKEN="$NODE_TOKEN" \
    INSTALL_K3S_EXEC="agent --snapshotter=fuse-overlayfs" \
    ./install-k3s.sh
else
    echo "ERREUR: ROLE doit être 'master' ou 'agent'."
    exit 1
fi

rm ./install-k3s.sh
