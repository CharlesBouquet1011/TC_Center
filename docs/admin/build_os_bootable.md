# build l'os utilisé dans la clé
L'os est la partie fondamentale du projet, il arrive avec k3s, podman, longhorn et helm déjà configurés (et monte également le volume persistant /dev/sda sur /mnt/k3sVolume) (attention, il faut avoir le disque lisible par linux)

pour build la clé, il faut mettre les fichiers "hosts", "authorized_keys" et "registries.yaml" dans le dossier osLive puis mkdir un dossier live dans le dossier osLive et enfin executer `sudo ../config.sfr` et `yes | sudo lb build`.
Attention il faut avoir installé la librairie live-build et ses dépendances (`sudo apt install live-build`) disponible uniquement sur debian. 

# authorized_keys:
contient les clés ssh, une par ligne et les pc possédant ces clés pourront se connecter au pc qui aura cet os.

Pour récupérer les clés ssh, il faut les générer et les récupérer dans ~/.ssh, c'est le fichier .pub 
Pour changer les clés ssh et qu'elles soient conservées après un reboot, il faudra refaire la clé avec le fichier authorized_keys modifié

# hosts:
cf le fichier hosts : le faut mettre le nom de l'host nodeXX en face de son IP publique (ou privée).
pour rajouter des nodes, il faudra modifier le fichier host et refaire la clé

# registries.yaml :
ce fichier sert à décrire dans quels registries kubernetes va aller chercher les images et comment ils se login pour ce registry (ex le registry DNS a besoin d'une méthode de login qui est défini dans configs)

de la forme
```yaml
mirrors:
  "ADRESSE IP":
    endpoint: 
      - "http://ADRESSEIP:PORT/" #en http ou https

  "DNS":
    endpoint:
      - "https://DNS"

configs: #si authentification
  "DNS":
    auth:
      username: username
      password: auth_token #à remplacer évidemment

```
