#!/bin/bash
MOUNT_POINT="/mnt/config"
CONF_PATH="$MOUNT_POINT/hosts"
TARGET="/etc/hosts"

# Monter la partition par label
if [ -b /dev/disk/by-label/CONFIG ]; then
    mkdir -p $MOUNT_POINT
    mount /dev/disk/by-label/CONFIG $MOUNT_POINT
fi

# Vérifie que le fichier existe, puis remplace tout /etc/hosts
if [ -f "$CONF_PATH" ]; then
    cp "$CONF_PATH" "$TARGET"
    echo "[update-hosts] /etc/hosts remplacé avec succès."
else
    echo "[update-hosts] Aucun fichier hosts.conf trouvé."
fi
# Vérifie qu'on a bien un hostname
while true; do
    HOSTNAME=$(systemd-ask-password --echo "Nom du noeud (nodeXX avec XX le numéro du noeud, 01, 02 etc)")

    if grep -qw "$HOSTNAME" /etc/hosts; then
        break
    else
        echo "❌ Nom invalide. '$HOSTNAME' n'existe pas dans /etc/hosts. Réessaie."
    fi
done
# Applique le hostname
hostnamectl set-hostname "$HOSTNAME"
echo "$HOSTNAME" > /etc/hostname

echo "Nom de machine défini sur : $HOSTNAME"
