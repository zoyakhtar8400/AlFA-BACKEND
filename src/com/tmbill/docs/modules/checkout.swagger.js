/**
 * OpenAPI Documentation: Check-Out Module
 */

module.exports = {
  '/api/v1/checkout': {
    post: {
      tags: ['Check-Out'],
      summary: 'Process Guest Check-Out & Final Room Folio Settlement',
      description: `
**Database Execution & Flow**:
- **Step 1**: Calculates total room nights, laundry, restaurant room service, and additional charges.
- **Step 2**: Deducts advance payments; settles pending balance.
- **Step 3**: Updates \`mpos_room_bookings\` status to 'CHECKED_OUT'.
- **Step 4**: Updates \`mpos_rooms\` status to 'CLEANUP_REQUIRED'.
      `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['bookingId', 'paymentMethod'],
              properties: {
                bookingId: { type: 'string', example: 'CHK-8801' },
                paymentMethod: { type: 'string', example: 'CARD' },
                additionalCharges: { type: 'number', example: 450.00 },
                discountAmount: { type: 'number', example: 0.00 }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Check-out folio settled and completed',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } }
          }
        }
      }
    }
  }
};
