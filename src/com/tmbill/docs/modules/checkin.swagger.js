/**
 * OpenAPI Documentation: Check-In Module
 */

module.exports = {
  '/api/v1/checkin': {
    post: {
      tags: ['Check-In'],
      summary: 'Process Guest Check-In & Room Assignment',
      description: `
**Database Execution & Flow**:
- **Step 1**: Inserts new guest record into \`mpos_guests\` / \`mpos_customers\` if non-existent.
- **Step 2**: Inserts check-in booking ledger entry into \`mpos_room_bookings\` with status 'CHECKED_IN'.
- **Step 3**: Updates room status in \`mpos_rooms\` to 'OCCUPIED'.
- **Step 4**: Generates advance payment receipt if advance amount provided.
      `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/CheckInRequest' }
          }
        }
      },
      responses: {
        201: {
          description: 'Guest checked in successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 201 },
                  message: { type: 'string', example: 'Check-In completed successfully' },
                  bookingId: { type: 'string', example: 'CHK-8801' }
                }
              }
            }
          }
        }
      }
    }
  }
};
