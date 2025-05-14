const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const db = require('../db/init');

function authenticateToken(req, res, next) {
    // Vérifier d'abord le header personnalisé
    const authHeader = req.headers['x-auth-token'];
    const requestType = req.headers['x-request-type'];

    // Si c'est une requête API, utiliser le header personnalisé
    if (requestType === 'API') {
        if (!authHeader) {
            return res.status(401).json({ message: 'Token manquant dans le header X-Auth-Token' });
        }

        jwt.verify(authHeader, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Token invalide' });
            }
            req.user = user;
            next();
        });
    } else {
        // Sinon, vérifier le cookie (pour la compatibilité)
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({ message: 'Token manquant dans les cookies' });
        }

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Token invalide' });
            }
            req.user = user;
            next();
        });
    }
}

module.exports = authenticateToken;
