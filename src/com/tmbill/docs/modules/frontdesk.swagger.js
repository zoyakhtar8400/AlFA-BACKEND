/**
 * OpenAPI Documentation: Front Desk Module
 */

module.exports = {
  '/api/v1/frontdesk/rooms': {
    get: {
      tags: ['Front Desk'],
      summary: 'Get All Rooms Status Grid',
      description: `
**Database Execution**:
- **Tables Queried**: \`mpos_rooms\` JOIN \`mpos_guests\` ON \`mpos_rooms.current_guest_id = mpos_guests.id\`
- Returns real-time room availability (VACANT, OCCUPIED, CLEANING, MAINTENANCE) for the Front Desk grid.
      `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Rooms grid data fetched successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Room' }
                  }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/UnauthorizedError' }
      }
    }
  }
};
