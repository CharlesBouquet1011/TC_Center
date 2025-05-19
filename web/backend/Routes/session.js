const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticate');
const db = require('../db/init');

router.get('/', authenticateToken, (req, res) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Token manquant' });

    db.all(`
        SELECT 
            s.id as session_id,
            s.user_id,
            s.token,
            s.created_at,
            u.username,
            u.email,
            CASE 
                WHEN s.token = ? THEN 'Session actuelle'
                ELSE 'Session inactive'
            END as status
        FROM sessions s 
        JOIN users u ON s.user_id = u.id 
        ORDER BY s.created_at DESC
    `, [token], (err, rows) => {
        if (err) {
            console.error('Erreur lors de la récupération des sessions:', err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des sessions', error: err.message });
        }
        res.json(rows || []);
    });
});

router.get('/:username', authenticateToken, (req, res) => {
    const { username } = req.params;
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Token manquant' });
    if (!username) return res.status(400).json({ message: 'Nom d\'utilisateur requis' });

    db.all(`
        SELECT 
            s.id as session_id,
            s.user_id,
            s.token,
            s.created_at,
            u.username,
            u.email,
            CASE 
                WHEN s.token = ? THEN 'Session actuelle'
                ELSE 'Session inactive'
            END as status
        FROM sessions s 
        JOIN users u ON s.user_id = u.id 
        WHERE u.username = ?
        ORDER BY s.created_at DESC
    `, [token, username], (err, rows) => {
        if (err) {
            console.error('Erreur lors de la récupération des sessions:', err);
            return res.status(500).json({ message: 'Erreur lors de la récupération des sessions', error: err.message });
        }
        if (!rows || rows.length === 0) {
            return res.status(404).json({ message: 'Aucune session trouvée pour cet utilisateur' });
        }
        res.json(rows);
    });
});

module.exports = router;
