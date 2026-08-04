/**
 * OpenAPI Documentation: Users & Roles Module
 */

module.exports = {
  '/api/v1/account/users': {
    get: {
      tags: ['Users & Roles'],
      summary: 'Get All Staff Accounts & Assigned Roles',
      description: `
**Database Execution**:
- **Table Queried**: \`mpos_users\` JOIN \`mpos_roles\`
- Returns list of system users, role definitions (Admin, Cashier, Captain, Waiter, Kitchen), and permissions.
      `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Staff users list fetched successfully',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } }
          }
        }
      }
    }
  }
};
