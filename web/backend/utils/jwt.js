const jwt = require('jsonwebtoken');
require('dotenv').config();

// Configuration du JWT
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_tres_securisee';

module.exports = {
    JWT_SECRET,
    JWT_OPTIONS: {
        expiresIn: '1h'  // Le token expire après 1 heure
    }
};