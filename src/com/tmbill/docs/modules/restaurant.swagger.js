/**
 * OpenAPI Documentation: Restaurant Module
 */

module.exports = {
  '/api/orders': {
    get: {
      tags: ['Restaurant'],
      summary: 'Get All Restaurant Orders',
      description: `
**Database Execution & Flow**:
- **Tables Queried**: \`mpos_orders\` JOIN \`mpos_bill_items\` ON \`mpos_orders.id = mpos_bill_items.bill_id\`
- Returns list of orders sorted by \`id DESC\` with subtotal, tax amounts, and detailed item lines.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/PageQuery' },
        { $ref: '#/components/parameters/LimitQuery' },
        { $ref: '#/components/parameters/StatusQuery' }
      ],
      responses: {
        200: {
          description: 'List of orders fetched successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  orders: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Order' }
                  }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/UnauthorizedError' }
      }
    }
  },
  '/api/orders/{id}': {
    get: {
      tags: ['Restaurant'],
      summary: 'Get Order & Invoice Details By ID',
      description: `
**Database Execution**:
- **Queries Run**: 
  \`SELECT * FROM mpos_orders WHERE id = $1\`
  \`SELECT * FROM mpos_bill_items WHERE bill_id = $1\`
- Used for generating thermal tax invoices and detailed bill view.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [{ $ref: '#/components/parameters/OrderIdParam' }],
      responses: {
        200: {
          description: 'Order details and bill items retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  data: { $ref: '#/components/schemas/Order' }
                }
              }
            }
          }
        },
        404: { $ref: '#/components/responses/NotFoundError' }
      }
    }
  }
};
