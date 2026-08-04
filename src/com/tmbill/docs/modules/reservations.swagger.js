/**
 * OpenAPI Documentation: Reservations Module
 */

module.exports = {
  '/api/reservations': {
    get: {
      tags: ['Reservations'],
      summary: 'Get All Table Reservations',
      description: `
**Database Execution**:
- **Table Queried**: \`mpos_table_reservations\`
- **Query Run**: \`SELECT * FROM mpos_table_reservations ORDER BY id DESC\`
      `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Reservations list fetched successfully from PostgreSQL',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  reservations: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Reservation' }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Reservations'],
      summary: 'Create New Table Reservation',
      description: `
**Database Execution & Flow**:
- **Step 1**: Inserts new reservation into \`mpos_table_reservations\`.
- **Step 2**: Updates target table state in \`mpos_tables\` to 'ORDERED' with customer name and status 'Reserved'.
      `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Reservation' }
          }
        }
      },
      responses: {
        201: {
          description: 'Reservation created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 201 },
                  reservation: { $ref: '#/components/schemas/Reservation' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/reservations/{id}': {
    patch: {
      tags: ['Reservations'],
      summary: 'Update Reservation Status (e.g. Cancelled, Checked-In)',
      description: `
**Database Execution**:
- **Query Run**: \`UPDATE mpos_table_reservations SET status = $1 WHERE id = $2\`
- If status is 'Cancelled', automatically frees the reserved table in \`mpos_tables\`.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/IdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'Cancelled' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Reservation status updated',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } }
          }
        }
      }
    }
  }
};
