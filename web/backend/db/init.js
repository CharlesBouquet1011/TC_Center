const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Créer une connexion à la base de données
const db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données:', err);
    } else {
        console.log('Connecté à la base de données SQLite');
        
        // Créer la table users si elle n'existe pas
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                reset_token TEXT,
                reset_token_expiry INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `, (err) => {
            if (err) {
                console.error('Erreur lors de la création de la table users:', err);
            } else {
                console.log('Table users vérifiée/créée avec succès');
            }
        });

        // Créer la table sessions si elle n'existe pas
        db.run(`
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token TEXT NOT NULL,
                username TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        `, (err) => {
            if (err) {
                console.error('Erreur lors de la création de la table sessions:', err);
            } else {
                console.log('Table sessions vérifiée/créée avec succès');
            }
        });

        // Vérifier la structure de la table users
        db.all("PRAGMA table_info(users)", [], (err, rows) => {
            if (err) {
                console.error('Erreur lors de la vérification de la structure:', err);
            } else {
                console.log('Structure de la table users:', rows);
            }
        });
    }
});

module.exports = db;