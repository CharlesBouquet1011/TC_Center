# Documentation - Configuration des PC

## Configuration

- Disque dur : 512 Go formaté en `ext4` pour les données
- Système d’exploitation : clé USB bootable contenant une image Debian personnalisée

---

## Connexion SSH
À configurer si vous souhaitez pouvoir vous connecter à distance et ainsi gérer votre datacenter sans être physiquement devant les machines.

### Ajout de votre clé SSH sur la machine 
tuto

### Connexion simple

Pour se connecter à la machine tout en connaissant son adresse IP:
```bash
ssh user@IP
```
ATTENTION la clé de la machine change à chaque Boot, si vous vous êtes connectés avant à cette machine, il y aura un problème et cela vous empêchera de vous connecter. Il faudra faire une commande qui va supprimer la machine problématique (par IP) dans la table des hôtes ssh, vous pourrez donc ensuite refaire ssh user@IP normalement.
```bash
ssh-keygen -R IP
```
