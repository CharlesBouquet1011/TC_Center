#!/bin/bash

# === CONFIGURATION ===
while true; do
    ROLE=$(systemd-ask-password --echo "Quel rôle pour ce nœud ? (master/agent)")
    
    if [[ "$ROLE" == "master" || "$ROLE" == "agent" ]]; then
        break
    else
        echo "ERREUR: Le rôle doit être 'master' ou 'agent'. Veuillez réessayer."
    fi
done
# =======================
/usr/local/bin/hostname-k3s.sh

echo "INFO: Récupération k3s"
echo ""

if  ! curl -sfL https://get.k3s.io -o ./install-k3s.sh ; then
    echo "ERREUR: Échec du téléchargement du script d'installation k3s."
    exit 1
fi
chmod +x ./install-k3s.sh

echo "INFO: Installation k3s en tant que ($ROLE)"
if [ "$ROLE" = "master" ]; then
    INSTALL_K3S_SKIP_ENABLE=true \
    INSTALL_K3S_EXEC="--snapshotter=fuse-overlayfs --token TC-Center" \
    ./install-k3s.sh

    sudo systemctl start k3s #lancer k3s comme service
    sudo chown user:user /etc/rancher/k3s/k3s.yaml #mettre ce fichier à user pour que le kubectl get nodes fonctionne

elif [ "$ROLE" = "agent" ]; then
    MASTER_IP=$(systemd-ask-password --echo "IP du serveur master :")
    if [ -z "$MASTER_IP" ]; then
        echo "ERREUR: MASTER_IP n'est pas défini."
        exit 1
    fi

    INSTALL_K3S_SKIP_ENABLE=true \
    K3S_URL="https://$MASTER_IP:6443" \
    K3S_TOKEN=TC-Center \
    INSTALL_K3S_EXEC="agent --snapshotter=fuse-overlayfs" \
    ./install-k3s.sh
    cp /usr/local/bin/registries.yaml /etc/rancher/k3s/registries.yaml 
    #configuration du repo k3s
    sudo systemctl start k3s-agent
else
    echo "ERREUR: ROLE doit être 'master' ou 'agent'."
    exit 1
fi

rm ./install-k3s.sh


#installation helm dernière version
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
if [ "$ROLE" = "master" ]; then
    echo 'export KUBECONFIG=/etc/rancher/k3s/k3s.yaml' >> /home/user/.bashrc
    fi

echo "Helm est installé avec succès."
