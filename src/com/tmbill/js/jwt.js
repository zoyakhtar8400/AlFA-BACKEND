const expressJwt = require('express-jwt');
const config = require('../config/config');

module.exports = jwt;

function jwt() {
    const secret = config.development.secret;
    return expressJwt({
        secret
    }).unless({
        path: [
            // public routes that don't require authentication
            '/api/login'
        ]
    });
}