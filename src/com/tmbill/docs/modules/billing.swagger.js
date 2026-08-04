/**
 * OpenAPI Documentation: Billing Module
 */

module.exports = {
  '/api/billing/summary': {
    get: {
      tags: ['Billing'],
      summary: 'Get Daily Billing & Revenue Summary',
      description: `
**Database Execution & Flow**:
- **Tables Queried**: \`mpos_orders\`, \`mpos_payments\`
- **Aggregations**: Computes cash total, card total, UPI total, discounts given, and CGST/SGST collected for the current business shift.
      `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Shift billing summary computed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  data: {
                    type: 'object',
                    properties: {
                      cashTotal: { type: 'number', example: 12500.00 },
                      cardTotal: { type: 'number', example: 18400.00 },
                      upiTotal: { type: 'number', example: 9300.00 },
                      grossTotal: { type: 'number', example: 40200.00 }
                    }
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
