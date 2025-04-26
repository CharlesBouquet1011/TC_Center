#!/bin/bash
CONF_PATH="/usr/local/bin/authorized_keys"
TARGET="/home/user/.ssh/authorized_keys"

[ -d /home/user/.ssh ] || mkdir -p /home/user/.ssh
chmod 700 /home/user/.ssh
# Monter la partition par label


if [ -f "$CONF_PATH" ]; then
    cp "$CONF_PATH" "$TARGET"
    chmod 600 "$TARGET"
    echo "[update-hosts] /home/user/.ssh/authorized_keys remplacé avec succès."
else
    echo "[update-hosts] Aucun fichier hosts.conf trouvé."
fi

chown user:user -R /home/user/.ssh
