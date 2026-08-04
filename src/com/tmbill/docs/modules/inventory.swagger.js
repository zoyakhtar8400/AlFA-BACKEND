/**
 * OpenAPI Documentation: Inventory Module
 */

module.exports = {
  '/api/v1/inventory/items': {
    get: {
      tags: ['Inventory'],
      summary: 'Get Raw Material & Inventory Stock Balances',
      description: `
**Database Execution**:
- **Table Queried**: \`mpos_inventory_items\`
- Returns current raw material stock balances, units, and low-stock alerts.
      `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Inventory items list retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  inventory: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/InventoryItem' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
