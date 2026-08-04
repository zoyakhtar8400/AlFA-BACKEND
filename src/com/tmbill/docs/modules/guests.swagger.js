/**
 * OpenAPI Documentation: Guests Module
 */

module.exports = {
  '/api/customer': {
    get: {
      tags: ['Guests'],
      summary: 'Get All Guests & Customer Profiles',
      description: `
**Database Execution**:
- **Table Queried**: \`mpos_customers\`
- Returns guest master profiles, phone numbers, ID proof info, and stay counts.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/SearchQuery' }],
      responses: {
        200: {
          description: 'List of guest profiles retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  customers: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Customer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Guests'],
      summary: 'Create New Guest Profile',
      description: `
**Database Execution**:
- **Query Run**: \`INSERT INTO mpos_customers (name, phone, email, address, id_proof_type, id_proof_number) VALUES ($1, $2, $3, $4, $5, $6)\`
      `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Customer' }
          }
        }
      },
      responses: {
        201: {
          description: 'Guest profile created successfully',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } }
          }
        }
      }
    }
  }
};
