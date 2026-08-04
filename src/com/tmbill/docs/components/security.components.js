/**
 * OpenAPI Security Component Definition for JWT Authorization
 */

module.exports = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Enter your JWT authorization token to authenticate API calls.'
  }
};
