#!/bin/bash
MOUNT_POINT="/mnt/config"
CONF_PATH="$MOUNT_POINT/authorized_keys"
TARGET="/home/user/.ssh/authorized_keys"

mkdir /home/user/.ssh
chmod 700 /home/user/.ssh
# Monter la partition par label
if [ -b /dev/disk/by-label/CONFIG ]; then
    mkdir -p $MOUNT_POINT
    mount /dev/disk/by-label/CONFIG $MOUNT_POINT
fi

if [ -f "$CONF_PATH" ]; then
    cp "$CONF_PATH" "$TARGET"
    chmod 600 "$TARGET"
    echo "[update-hosts] /home/user/.ssh/authorized_keys remplacé avec succès."
else
    echo "[update-hosts] Aucun fichier hosts.conf trouvé."
fi
