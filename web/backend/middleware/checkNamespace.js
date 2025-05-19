const db = require('../db/init');

const checkNamespace = async (req, res, next) => {
    try {
        const namespace = req.params.namespace || req.query.namespace || req.body.namespace;
        
        if (!namespace) {
            return res.status(400).json({ message: 'Namespace manquant dans la requête' });
        }

        // Vérifier que le namespace correspond à celui de l'utilisateur
        db.get('SELECT namespace FROM users WHERE id = ?', [req.user.id], (err, user) => {
            if (err) {
                return res.status(500).json({ message: 'Erreur lors de la vérification du namespace' });
            }

            if (!user) {
                return res.status(404).json({ message: 'Utilisateur non trouvé' });
            }

            if (user.namespace !== namespace) {
                return res.status(403).json({ message: 'Accès non autorisé à ce namespace' });
            }

            next();
        });
    } catch (err) {
        return res.status(500).json({ message: 'Erreur lors de la vérification du namespace' });
    }
};

module.exports = checkNamespace; 