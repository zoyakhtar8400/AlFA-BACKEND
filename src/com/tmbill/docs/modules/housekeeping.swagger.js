/**
 * OpenAPI Documentation: Housekeeping Module
 */

module.exports = {
  '/api/v1/housekeeping/tasks': {
    get: {
      tags: ['Housekeeping'],
      summary: 'Get Housekeeping Tasks & Room Cleaning Schedules',
      description: `
**Database Execution**:
- **Table Queried**: \`mpos_housekeeping_tasks\` JOIN \`mpos_rooms\`
- Returns list of room cleaning tasks, assigned staff, and completion status.
      `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Housekeeping tasks list retrieved',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  tasks: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/HousekeepingTask' }
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
