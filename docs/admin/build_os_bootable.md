# build l'os utilisé dans la clé
L'os est la partie fondamentale du projet, il arrive avec k3s, podman, longhorn et helm déjà configurés (et monte également le volume persistant /dev/sda sur /mnt/k3sVolume) (attention, il faut avoir le disque lisible par linux)

pour build la clé, il faut mettre les fichiers "hosts", "authorized_keys" et "registries.yaml" dans le dossier osLive puis mkdir un dossier live dans le dossier osLive et enfin executer `sudo ../config.sfr` et `yes | sudo lb build`.
Attention il faut avoir installé la librairie live-build et ses dépendances (`sudo apt install live-build`) disponible uniquement sur debian. 

# authorized_keys:
contient les clés ssh, une par ligne et les pc possédant ces clés pourront se connecter au pc qui aura cet os.

Pour récupérer les clés ssh, il faut les générer et les récupérer dans ~/.ssh, c'est le fichier .pub 

# hosts:
cf le fichier hosts : le faut mettre le nom de l'host nodeXX en face de son IP publique (ou privée).


# registries.yaml :

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
