const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../utils/jwt');
const db = require('../db/init');

const authenticateToken = async (req, res, next) => {
    try {
        // Vérifier d'abord le header personnalisé
        const authHeader = req.headers['x-auth-token'];
        const requestType = req.headers['x-request-type'];

        let token;
        // Si c'est une requête API, utiliser le header personnalisé
        if (requestType === 'API' && authHeader) {
            token = authHeader;
        } else {
            // Sinon, vérifier le cookie
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ message: 'Token manquant' });
        }

        // Vérifier le token JWT
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Vérifier si la session existe dans la base de données
        db.get('SELECT * FROM sessions WHERE token = ? AND user_id = ?', 
            [token, decoded.id], 
            (err, session) => {
                if (err) {
                    return res.status(500).json({ message: 'Erreur lors de la vérification de la session' });
                }
                
                if (!session) {
                    return res.status(403).json({ message: 'Session invalide ou expirée' });
                }

                req.user = decoded;
                next();
            }
        );
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expiré' });
        }
        return res.status(403).json({ message: 'Token invalide' });
    }
};

module.exports = authenticateToken;
