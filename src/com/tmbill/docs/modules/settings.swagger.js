/**
 * OpenAPI Documentation: Settings Module
 */

module.exports = {
  '/api/terminal': {
    get: {
      tags: ['Settings'],
      summary: 'Get Registered POS Terminals & Printer Mappings',
      description: `
**Database Execution**:
- **Table Queried**: \`mpos_terminal\`
- Returns list of hardware terminals, IP addresses, thermal printer assignments, and licensing status.
      `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Terminal hardware setup retrieved',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } }
          }
        }
      }
    }
  }
};
