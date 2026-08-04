/**
 * OpenAPI Documentation: Authentication Module
 */

module.exports = {
  '/api/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Staff & Manager Login',
      description: 'Authenticate user credentials and generate signed JWT bearer token.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/LoginRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Login successful. Returns authorization bearer JWT token.',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/AuthResponse' }
            }
          }
        },
        401: {
          description: 'Invalid username, password or inactive user credentials'
        }
      }
    }
  },
  '/api/auth/profile': {
    get: {
      tags: ['Authentication'],
      summary: 'Get Current Authenticated Staff Profile',
      description: 'Returns authenticated user details, assigned terminal privileges, and current store scope from DB token session.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'User profile retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer', example: 1 },
                      username: { type: 'string', example: 'admin' },
                      role: { type: 'string', example: 'ADMIN' }
                    }
                  }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/UnauthorizedError' }
      }
    }
  }
};
