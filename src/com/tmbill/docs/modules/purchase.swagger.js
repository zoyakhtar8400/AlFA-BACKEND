/**
 * OpenAPI Documentation: Purchase Module
 */

module.exports = {
  '/api/v1/purchase/orders': {
    get: {
      tags: ['Purchase'],
      summary: 'Get Purchase Orders & Vendor Receipts',
      description: `
**Database Execution**:
- **Table Queried**: \`mpos_purchase_orders\` JOIN \`mpos_vendors\`
- Returns vendor purchase orders, GRN notes, and supplier invoices.
      `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Purchase orders list retrieved',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } }
          }
        }
      }
    }
  }
};
