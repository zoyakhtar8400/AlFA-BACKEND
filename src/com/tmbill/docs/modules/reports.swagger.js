/**
 * OpenAPI Documentation: Reports Module
 */

module.exports = {
  '/api/v1/report/sales': {
    get: {
      tags: ['Reports'],
      summary: 'Get Detailed Sales Report By Date Range',
      description: `
**Database Execution**:
- **Tables Queried**: \`mpos_orders\`
- **Filter**: \`WHERE created_at BETWEEN $1 AND $2\`
- Returns itemized sales, tax breakdown, waiter commission, and discount audit logs.
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'startDate',
          in: 'query',
          required: true,
          schema: { type: 'string', example: '2026-08-01' }
        },
        {
          name: 'endDate',
          in: 'query',
          required: true,
          schema: { type: 'string', example: '2026-08-03' }
        }
      ],
      responses: {
        200: {
          description: 'Sales report generated successfully',
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/SuccessResponse' } }
          }
        }
      }
    }
  }
};
