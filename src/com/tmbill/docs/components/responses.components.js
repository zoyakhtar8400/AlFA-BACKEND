/**
 * Reusable Standard HTTP Responses & Error Schemas
 */

module.exports = {
  SuccessResponse: {
    type: 'object',
    properties: {
      status: { type: 'integer', example: 200 },
      message: { type: 'string', example: 'Operation completed successfully' },
      data: { type: 'object', description: 'Payload data' }
    }
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      status: { type: 'integer', example: 400 },
      message: { type: 'string', example: 'Invalid parameter or database request failure' }
    }
  },
  UnauthorizedError: {
    description: 'Unauthorized - Missing or invalid JWT authentication token',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            status: { type: 'integer', example: 401 },
            message: { type: 'string', example: 'Unauthorized access token' }
          }
        }
      }
    }
  },
  NotFoundError: {
    description: 'Resource Not Found',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            status: { type: 'integer', example: 404 },
            message: { type: 'string', example: 'Requested record does not exist in database' }
          }
        }
      }
    }
  },
  InternalServerError: {
    description: 'Internal Server Error',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            status: { type: 'integer', example: 500 },
            message: { type: 'string', example: 'Internal server or PostgreSQL database execution error' }
          }
        }
      }
    }
  }
};
