# Mettre en place un datacenter

Ce guide fournit une vue d’ensemble sur les étapes et composants nécessaires pour construire un datacenter auto-hébergé, basé sur des machines physiques, une configuration réseau personnalisée, et une supervision complète.

---

## Le matériel

Présentation du matériel utilisé pour le déploiement du datacenter, incluant :

- Des **PC classiques** configurés comme nœuds du cluster :  
  [📄 Voir la fiche matériel des PC](https://github.com/CharlesBouquet1011/TC_Center/blob/main/docs/admin/PC.md)

- Des **lames serveur** centralisant certaines fonctions critiques :  
  [📄 Voir la fiche matériel des lame](https://github.com/CharlesBouquet1011/TC_Center/blob/main/docs/admin/Lame.md)

Chaque machine est décrite en détail : capacité disque, réseau, usage prévu, et spécificités d’installation.

---

## Les configurations

Cette partie détaille la création d’une **clé bootable** avec une image Debian personnalisée utilisée pour initialiser toutes les machines du cluster.

- Création de l’image ISO
- Ajout des outils nécessaires (SSH, monitoring, etc.)
- Mise en place d’un système léger et réplicable

[📄 Consulter le guide de création de clé bootable](https://github.com/CharlesBouquet1011/TC_Center/blob/main/docs/admin/build_os_bootable.md)

---
## le boot

Cette partie détaille les paramètres à donner aux pc lors de leur boot.
[📄 Consulter le guide du boot](https://github.com/CharlesBouquet1011/TC_Center/blob/main/docs/admin/boot.md)

## Monitoring

Une fois les machines déployées, il est crucial de pouvoir **surveiller leur état et leur comportement**. Deux outils sont utilisés :

- **Headlamp** : interface graphique simple pour visualiser l’état du cluster Kubernetes
- **Grafana + OpenTelemetry** : stack complète pour collecter, visualiser et analyser les métriques et logs

Cette partie fournit un guide pour installer et configurer ces outils via Helm.

[📄 Accéder à la documentation Monitoring](https://github.com/CharlesBouquet1011/TC_Center/blob/main/docs/admin/monitoring.md)

---

## Solution de stockage distribué
**Longhorn** permet :

- La persistance des volumes même en cas de redémarrage ou déplacement de pods
- La réplication des données sur plusieurs nœuds
- La gestion via une interface web ou des CRD Kubernetes
- la gestion des volumes sur les noeuds

[📄 Voir la configuration Longhorn](https://github.com/CharlesBouquet1011/TC_Center/blob/main/docs/admin/longhorn.md)

---

