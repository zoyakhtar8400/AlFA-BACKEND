/**
 * OpenAPI Documentation: Tables Module
 */

module.exports = {
  '/api/tables': {
    get: {
      tags: ['Tables'],
      summary: 'Get All Restaurant Tables & Live Statuses',
      description: `
**Database Execution**:
- **Query Run**: \`SELECT * FROM mpos_tables WHERE isactive = 1 ORDER BY id ASC\`
- Normalizes order state (\`AVAILABLE\` -> white, \`KOT_CUT\`/\`Running\` -> orange, \`Paid\` -> green).
      `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of all restaurant dining tables retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  tables: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Table' }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Tables'],
      summary: 'Create A New Dining Table',
      description: `
**Database Execution**:
- **Query Run**: \`INSERT INTO mpos_tables (table_name, seats, floor, section, order_state) VALUES ($1, $2, $3, $4, 'AVAILABLE')\`
      `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['tableName', 'seats'],
              properties: {
                tableName: { type: 'string', example: 'Table 15' },
                seats: { type: 'integer', example: 6 },
                floor: { type: 'string', example: 'First Floor' },
                section: { type: 'string', example: 'AC Dining' }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Dining table created successfully',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } }
          }
        }
      }
    }
  },
  '/api/tables/{id}/status': {
    patch: {
      tags: ['Tables'],
      summary: 'Patch Table Status Directly (Blank, Running, Paid, Cleaning)',
      description: `
**Database Execution**:
- **Query Run**: \`UPDATE mpos_tables SET order_state = $1, extra_details = $2 WHERE id = $3\`
      `,
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/TableIdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'Blank' },
                amount: { type: 'number', example: 0 }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Table status patched successfully',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } }
          }
        }
      }
    }
  }
};
