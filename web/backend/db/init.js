const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./users.db');

// Création des tables
db.serialize(() => {
    // Créer la table users
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Supprimer l'ancienne table sessions si elle existe
    db.run(`DROP TABLE IF EXISTS sessions`, (err) => {
        if (err) {
            console.error('Erreur lors de la suppression de la table sessions:', err);
        } else {
            console.log('Ancienne table sessions supprimée');
        }

        // Créer la nouvelle table sessions avec le champ username
        db.run(`CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            username TEXT NOT NULL,
            token TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`, (err) => {
            if (err) {
                console.error('Erreur lors de la création de la table sessions:', err);
            } else {
                console.log('Nouvelle table sessions créée avec succès');
            }
        });
    });
});

module.exports = db;