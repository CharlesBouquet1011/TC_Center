#!/bin/bash
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
