const db = require('../db/init');

const checkNamespace = async (req, res, next) => {
    console.log('=== Début de la vérification du namespace ===');
    console.log('Headers:', req.headers);
    console.log('User:', req.user);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    console.log('Params:', req.params);

    try {
        // Récupérer le namespace de différentes sources possibles
        const namespace = req.params.namespace || 
                         req.query.namespace || 
                         req.body.namespace || 
                         (req.body && req.body.data && req.body.data.namespace);

        console.log('Namespace trouvé:', namespace);
        console.log('Sources:', {
            params: req.params.namespace,
            query: req.query.namespace,
            body: req.body.namespace,
            bodyData: req.body && req.body.data && req.body.data.namespace
        });

        if (!namespace) {
            console.error('Namespace manquant dans la requête');
            return res.status(400).json({ message: 'Namespace manquant dans la requête' });
        }

        // Vérifier que le namespace correspond au nom d'utilisateur
        console.log('Vérification du namespace pour l\'utilisateur:', req.user.id);
        
        // Le namespace doit correspondre au nom d'utilisateur en minuscules
        const userNamespace = req.user.username.toLowerCase();
        console.log('Comparaison des namespaces:', {
            userNamespace: userNamespace,
            requestNamespace: namespace,
            match: userNamespace === namespace
        });

        if (userNamespace !== namespace) {
            console.error('Namespace non autorisé:', { 
                user: userNamespace, 
                request: namespace,
                userId: req.user.id
            });
            return res.status(403).json({ message: 'Accès non autorisé à ce namespace' });
        }

        console.log('Vérification du namespace réussie');
        next();
    } catch (err) {
        console.error('Erreur middleware:', err);
        console.error('Stack trace:', err.stack);
        return res.status(500).json({ message: 'Erreur lors de la vérification du namespace' });
    }
};

module.exports = checkNamespace; 