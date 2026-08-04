/**
 * OpenAPI Documentation: Kitchen (KOT) Module
 */

module.exports = {
  '/api/kot': {
    get: {
      tags: ['Kitchen (KOT)'],
      summary: 'Get All KOT Tickets',
      description: `
**Database Execution & Flow**:
- **Tables Queried**: \`mpos_kot_master\` JOIN \`mpos_kot_item_master\` ON \`kot_id\`
- Returns list of all active/kitchen tickets for KDS (Kitchen Display System) or View KOT page.
      `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'List of KOT tickets retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  kots: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/KOT' }
                  }
                }
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Kitchen (KOT)'],
      summary: 'Create & Print New Kitchen Order Ticket (KOT)',
      description: 'Inserts KOT ticket & items, updates table status to KOT_CUT, and prints receipt.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CreateKotRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'KOT ticket created and routed to kitchen printer successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 201 },
                  message: { type: 'string', example: 'KOT created successfully' },
                  kotId: { type: 'string', example: 'KOT-104' }
                }
              }
            }
          }
        },
        400: { $ref: '#/components/responses/ErrorResponse' }
      }
    }
  },
  '/api/kot/{id}/move': {
    post: {
      tags: ['Kitchen (KOT)'],
      summary: 'Move KOT From Source Table To Destination Table',
      description: 'Reassigns KOT record to destination table ID, sets target table active, and updates table grid status.',
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/KotIdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/MoveKotRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'KOT moved successfully across tables in database',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  message: { type: 'string', example: 'KOT moved from Table 1 to Table 2 successfully' },
                  data: {
                    type: 'object',
                    properties: {
                      kotId: { type: 'integer', example: 42 },
                      fromTableId: { type: 'integer', example: 1 },
                      toTableId: { type: 'integer', example: 2 }
                    }
                  }
                }
              }
            }
          }
        },
        404: { $ref: '#/components/responses/NotFoundError' }
      }
    }
  },
  '/api/kot/{id}/status': {
    patch: {
      tags: ['Kitchen (KOT)'],
      summary: 'Update KOT Status (Preparing, Ready, Served, Cancelled)',
      description: `
**Database Execution**:
- **Query Run**: \`UPDATE mpos_kot_master SET status = $1 WHERE kot_id = $2\`
- Used by KDS (Kitchen Display System) to transition item preparation statuses.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/KotIdParam' }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'Ready', description: 'Preparing, Ready, Served, Cancelled' }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'KOT status updated successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        }
      }
    }
  }
};
