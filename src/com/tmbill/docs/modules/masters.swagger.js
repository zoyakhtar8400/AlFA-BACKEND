/**
 * OpenAPI Documentation: Masters Module
 */

module.exports = {
  '/api/categories': {
    get: {
      tags: ['Masters'],
      summary: 'Get All Active Menu Categories',
      description: `
**Database Execution**:
- **Table Queried**: \`mpos_category_master\`
- **Query Run**: \`SELECT * FROM mpos_category_master WHERE is_active = 1\`
      `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Categories catalog retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  categories: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Category' }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/api/menu-items': {
    get: {
      tags: ['Masters'],
      summary: 'Get Complete Restaurant Menu Catalog',
      description: `
**Database Execution**:
- **Tables Queried**: \`mpos_item_master\` JOIN \`mpos_category_master\`
- Returns list of active menu items with price, department routing, and tax codes.
      `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Menu catalog items retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  items: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/MenuItem' }
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
