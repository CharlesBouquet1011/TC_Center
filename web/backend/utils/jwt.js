// En production, utilisez une variable d'environnement
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_tres_securisee';

module.exports = {
    JWT_SECRET,
    JWT_OPTIONS: {
        expiresIn: '24h'
    }
};