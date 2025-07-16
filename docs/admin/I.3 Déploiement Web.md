# Guide de Déploiement de TC Center

Ce guide décrit les étapes nécessaires pour déployer l'application TC Center sur le master.

## Prérequis

- Node.js et npm installés
- Python installé
- Build-essential installé

## Installation

1. Cloner le dépôt GitHub, il est normalement déjà cloné dans mnt/k3sVolume/TC_Center:
```bash
git clone <url_du_repo>
cd TC_Center
```

2. Installer les dépendances et démarrer l'application :
```bash
cd web/backend
npm install
npm start
```

## Accès à l'application

Une fois l'application démarrée, elle sera accessible à l'adresse :
```
http://<ip_serveur>:3000
```

## Notes importantes

- L'application doit être déployée sur le serveur master en raison de contraintes techniques
- Assurez-vous que le port 3000 est accessible sur le serveur

