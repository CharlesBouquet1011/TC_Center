

# configuration Initiale
sudo ./configAfterBoot.sh
Si le disque n'a pas été formatté il y aura une erreur au montage du volume /mnt/k3sVolume, pas grave pour l'instant
on peut maintenant se connecter en ssh sur la machine:

# SSH
ssh user@IP tout simplement
ATTENTION la clé de la machine change à chaque Boot, si vous vous êtes connectés avant à cette machine, il y aura un problème et cela vous empêchera de vous connecter => il faut donc faire la commande:
ssh-keygen -R IP
qui va supprimer la machine problématique (par IP) dans la table des hôtes ssh, vous pourrez donc ensuite refaire ssh user@IP et dire yes

# Kubernetes:
à suivre