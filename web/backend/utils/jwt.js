// En production, utilisez une variable d'environnement
import defaultEnv from '../../default.env';
const JWT_SECRET = process.env.JWT_SECRET || defaultEnv.jwt;

module.exports = {
    JWT_SECRET,
    JWT_OPTIONS: {
        expiresIn: '24h'
    }
};