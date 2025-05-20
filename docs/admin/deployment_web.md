# Guide de Déploiement de TC Center

Ce guide décrit les étapes nécessaires pour déployer l'application TC Center sur un serveur.

## Prérequis

- Node.js et npm installés
- Python installé
- Build-essential installé
- Accès au serveur master (contrainte technique)

## Installation

1. Cloner le dépôt GitHub :
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
- Les logs de l'application sont disponibles dans le dossier `logs`

## Dépannage

Si vous rencontrez des problèmes lors du déploiement :

1. Vérifiez que tous les prérequis sont installés
2. Assurez-vous d'être sur le serveur master
3. Vérifiez les logs pour plus de détails sur les erreurs potentielles 