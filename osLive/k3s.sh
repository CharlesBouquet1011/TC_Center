#!/bin/bash
/usr/local/bin/startmount.sh
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
    INSTALL_K3S_EXEC="--snapshotter=fuse-overlayfs --token TC-Center --data-dir /mnt/k3sVolume/k3s" \
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
    INSTALL_K3S_EXEC="agent --snapshotter=fuse-overlayfs --data-dir /mnt/k3sVolume/k3s"  \
    ./install-k3s.sh
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
    #config trafik:
    helm repo add traefik https://traefik.github.io/charts
    helm repo update
    helm upgrade --install traefik traefik/traefik \
    --namespace kube-system \
    --create-namespace \
    --set crds.enabled=true
    
    #./grafana.sh
    fi

echo "Helm est installé avec succès."

#longhorn
sudo rm /etc/initramfs/post-update.d/z50-raspi-firmware
sudo dpkg --configure -a
while ! mountpoint -q /var/lib/longhorn; do
    echo "🔄 Tentative de montage du volume Longhorn..."

    # Vérifie si le dossier source existe
    if [ ! -d /mnt/k3sVolume/longhorn ]; then
        echo "❌ ERREUR : le dossier /mnt/k3sVolume/longhorn n'existe pas."
        mkdir -p /mnt/k3sVolume/longhorn || {
            echo "❌ Impossible de créer /mnt/k3sVolume/longhorn"
            exit 1
        }
    fi

    # Crée le dossier cible si nécessaire
    mkdir -p /var/lib/longhorn

    # Tente le bind mount
    mount --bind /mnt/k3sVolume/longhorn /var/lib/longhorn

    # Petite pause si ça échoue (pour éviter boucle folle)
    sleep 1
done
if [ "$ROLE" = "master" ]; then

    kubectl apply -f https://raw.githubusercontent.com/longhorn/longhorn/master/deploy/longhorn.yaml
    kubectl -n longhorn-system delete pod -l app=longhorn-manager
    fi

#config podman:
mkdir -p /home/user/.config/containers/
cat > /home/user/.config/containers/registries.conf <<EOF
unqualified-search-registries = ["docker.io"]
[[registry]]
prefix = "docker.io"
location = "docker.io"
[[registry]]
prefix = "134.214.202.221:5000"
insecure = true
location = "134.214.202.221:5000"
EOF

sudo mkdir -p /mnt/k3sVolume/podman/share/containers/storage
sudo chown -R user:user /mnt/k3sVolume/podman/share/containers

sudo chown -R user:user /mnt/k3sVolume/podman/share

cat > /home/user/.config/containers/storage.conf <<EOF
[storage]
driver = "vfs"
graphroot = "/mnt/k3sVolume/podman/share/containers//storage"
runroot = "/run/user/1000/containers"
EOF
sudo chown -R user:user /mnt/k3sVolume #patch normalement
while [ "$(stat -c '%U:%G' /home/user/.config)" != "user:user" ]; do
  echo "Le dossier n'est pas encore à user:user, tentative de correction..."
  sudo chown -R user:user /home/user/.config
  sleep 1
done

podman system reset
