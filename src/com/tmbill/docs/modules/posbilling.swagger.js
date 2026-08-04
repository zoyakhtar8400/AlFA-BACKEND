/**
 * OpenAPI Documentation: POS Billing Module
 */

module.exports = {
  '/api/billing/settle': {
    post: {
      tags: ['POS Billing'],
      summary: 'Settle Bill & Execute Payment (Cash, Card, UPI, Split)',
      description: 'Settle order bill, insert payment lines, and update table state to Paid.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/PaymentSettlementRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Payment settled and bill completed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  message: { type: 'string', example: 'Payment settled successfully' },
                  billId: { type: 'string', example: 'BILL-0039' }
                }
              }
            }
          }
        },
        400: { $ref: '#/components/responses/ErrorResponse' }
      }
    }
  }
};
