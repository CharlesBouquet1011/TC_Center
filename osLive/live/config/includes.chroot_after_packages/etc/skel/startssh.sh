#!/bin/bash

# Génération des clés d'hôte si elles n'existent pas
if [ ! -f /etc/ssh/ssh_host_rsa_key ]; then
    ssh-keygen -A
fi

systemctl start ssh
echo "SSH server started on port 22"
chmod +x config/includes.chroot_after_packages/etc/skel/startssh.sh

#on récupère les clés dans /etc/ssh et ce sont les fichiers ssh_host_rsa_key et  ssh_host_rsa_key.pub (les cat)