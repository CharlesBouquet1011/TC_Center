## Démarrage (configuration par port série)
##### Lister les interfaces disponible de port série
Commande : dmesg | grep tty
##### Se connecter au port série
Commande : `screen /dev/<interface> <base-baud>`
Exemple : `screen /dev/ttyS0 115200`
##### Quitter le port série
Commande : `ctrl+a` puis `ctrl+z`

---
## Interfaces
+ Power
+ Power over Ethernet (PoE)
+ Console
+ FE LAN
	+ FastEthernet0
	+ FastEthernet1
	+ FastEthernet2
	+ FastEthernet3
+ FE WAN
	+ Fast Ethernet4
---
## Entrer en mode de configuration
```
Router> enable
Router# configure terminal
```
## Configuration de l'interface WAN (FastEthernet4)
```
Router(config)# interface FastEthernet4
	Router(config-if)# ip address 134.214.202.221 255.255.0.0
	Router(config-if)# no shutdown
	Router(config-if)# exit
```
## Remarque : route pour sortir vers Internet dans un sous réseau
```
Router(config)# ip route 0.0.0.0 0.0.0.0 192.168.100.1
```
Note :
+ `0.0.0.0` : Adresse réseau destination = « tout »
+ `0.0.0.0` (masque) : Masque = 0 bits = « ne compare rien »
+ `0.0.0.0 0.0.0.0` (ensemble) : Tout le trafic vers n’importe quelle IP
+ `192.168.100.1` : Passerelle WAN (prochaine étape) (à utiliser quand aucune route plus précise)
+ => "Pour toute destination que je ne connais pas (0.0.0.0/0), envoie le trafic à **192.168.100.1**."
### Configuration VLAN
```
Router(config)# interface vlan1 # format : vlan+numéro
	Router(config-if)# ip address 10.0.0.1 255.255.255.0
	Router(config-if)# no ip directed-broadcast # (optionnel) désactive la diffusion des broadcasts dirigés (sécurité)
	Router(config-if)# no ip route-cache # (optionnel) désactive le cache de routage sur cette interface
	Router(config-if)# no shutdown
	Router(config-if)# exit
```
Note :
+ Désactiver le broadcast = éviter des attaques comme le **Smurf attack**, où des paquets broadcast sont utilisés pour amplifier une attaque DDoS (par défaut activé).
+ Désativer le cache = chaque paquet est traité individuellement, sans utiliser un cache d’itinéraire pré-calculé. Sur des équipements plus anciens, cela pouvait être utilisé pour résoudre des problèmes de performance ou de bugs liés au cache, mais sur les équipements récents, le cache est géré différemment.
Remarque :
+ Un VLAN possède une seule MAC adresse logique (utilise l'une des adresses MAC disponible dans le pool d'interfaces physiques qui possèdes chacune une adresse MAC)  et une adresse IP.
+ Les adresses MAC physiques de chaque interface ne sont pas utilisées, elles ne possèdent pas d'adresse IP en mode commuté (switch de niveau 2).
+ `no switchport` permet de convertir une interface **de niveau 2 (switch)** en interface **de niveau 3 (routeur)**.
> [!CAUTION] Remarque
> Par défaut, les **4 ports LAN (Fa0 à Fa3)** sont **membres d’un switch intégré**, ils sont dans le **même VLAN** (VLAN1), et donc **pas routés entre eux**, **mais commutés** comme dans un switch classique.
## Relier une interface physique au VLAN
```
Router(config)# interface range FastEthernet0 - 3 # configure de FE0 à FE3 (LAN)
	Router(config-if-range)# switchport mode access
	Router(config-if-range)# switchport access vlan 1 # relie l'interface au VLAN 1
	Router(config-if-range)# no shutdown
	Router(config-if-range)# exit
```
Note :
+ Access mode : le port du switch est dédié à un **seul VLAN** (généralement un VLAN utilisateur), il ne transporte que le trafic d’un seul VLAN non tagué. Cela correspond souvent à un port connecté à un poste utilisateur, une imprimante, un serveur qui ne gère pas de VLAN.
+ Trunk mode : le port transporte **plusieurs VLANs** en taguant les paquets (802.1Q), utile pour les liaisons entre switches ou entre switch et routeur (subinterfaces VLAN).

> [!CAUTION] Remarque
> On ne voit pas apparaitre l'effet des commandes pour le VLAN 1 dans le fichier de configuration car **par défaut, tous les ports Fa0-3 sont membres du VLAN 1**.
## Configuration DHCP
```
Router(config)# ip dhcp pool <pool-name> #  création du serveur DHCP
	Router(dhcp-config)# network 10.0.0.0 255.255.255.0 # réseau annoncé
	Router(dhcp-config)# default-router 10.0.0.1 # passerelle annoncée
	Router(dhcp-config)# dns-server 1.1.1.1 # serveur DNS annoncé
	Router(dhcp-config)# lease 7 # durée du bail DHCP (en jours)
	Router(dhcp-config)# exit
Router(config)# ip dhcp excluded-address 10.0.0.1 10.0.0.100 # intervalle d'adresse réservée
```
Note :
+ Afficher les baux DHCP : `show ip dhcp binding`
+ Réinitialiser un bail DHCP : `clear ip dhcp binding 10.0.0.25`
+ Réinitialiser tout les baux DHCP : `clear ip dhcp binding *`
+ Réinitialiser les statistiques DHCP : `clear ip dhcp server statistics`
+ Mode debug : `debug ip dhcp server events`
+ Sortir du mode debug : `undebug all` ou `un all`

+ Forcer le renouvellement DHCP côté machine
	+ Windows : `ipconfig /release` puis `ipconfig /renew`
	+ Linux / macOS : `sudo dhclient -r` (libère l’adresse IP) puis `sudo dhclient` (demande une nouvelle IP)
## Configuration DHCP statique (pour une machine)
```
Router(config)# ip dhcp pool PC1
	Router(dhcp-config)# host 10.0.0.10 255.255.255.0
	Router(dhcp-config)# client-identifier 01aa.bbcc.ddee.ff
	Router(dhcp-config)# default-router 10.0.0.1
	Router(dhcp-config)# dns-server 1.1.1.1
	Router(dhcp-config)# exit
```
Note :
+ Format adresse MAC :  le premier octet **`01`** est un **type matériel** qui signifie Ethernet, le reste `(aa.bbcc.ddee.ff)` est l'adresse MAC réelle.
+ Bien préciser le routeur par défaut et le serveur DNS, même s'il est déjà précisé dans le pool DHCP.
## Définir les zones NAT
```
Router(config)# interface Vlan1
	Router(config-if)# ip nat inside
```

```
Router(config)# interface FastEthernet4
	Router(config-if)# ip nat outside
```
## Créer une ACL (Access Control List) pour identifier les IP internes à nater
```
Router(config)# access-list 1 permit 10.0.0.0 0.0.0.255
```
Note :
+ `access-list 1` : création ou modification de la **liste d'accès numéro 1** (ACL standard, numérotée de 1 à 99)
+ `permit` : autorisation (au lieu de bloquer)
+ `10.0.0.0` : adresse réseau de départ que l’ACL va couvrir
+ `0.0.0.255` : masque générique inversé (wildcard mask), différent d'un masque de sous-réseau classique. (0 : les bits **doivent correspondre exactement** / 1 : les bits peuvent **varier**)
+ => "Autorise toutes les IP **de 10.0.0.1 à 10.0.0.254** à être concernées par cette ACL"
## Appliquer le NAT dynamique (masquerading / PAT)
```
Router(config)# ip nat inside source list 1 interface FastEthernet4 overload
```
Note :
+ `overload` = port address translation (PAT)
+ Vérifications : 
	+ `show ip nat translations`
	+ `show ip nat statistics`
## Remarque : NAT statique (liaison IP privée <-> IP publique fixe)
```
Router(config)# ip nat inside source static 10.0.0.100 134.214.202.221
```
## Réinitialiser le routeur à son état d'usine
##### Effacer la configuration de démarrage (startup-config)
`Router# write erase` ou `Router# erase startup-config`
##### Lister les fichiers stockés sur le routeur
`Router# dir` ou `Router# dir flash:` pour voir le contenu de la mémoire flash (où la configuration et l'image IOS sont stockées)
Note :
+ Fichiers courants :
	- `config.text` → configuration enregistrée (startup-config)
	- `private-config.text` → fichiers sensibles (certificats, clés, etc.)
	- `vlan.dat` → base de données VLAN (pour les switchs intégrés)
	- `.bin` → image IOS du système
##### Supprimer les anciens fichiers VLAN si existants (pour les switches ou routeurs avec switch intégré)
`Router# delete flash:vlan.dat`
##### Redémarrer le routeur
`Router# reload`
`System configuration has been modified. Save? [yes/no]: no`