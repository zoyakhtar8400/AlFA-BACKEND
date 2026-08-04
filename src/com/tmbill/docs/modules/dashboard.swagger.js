/**
 * OpenAPI Documentation: Dashboard Module
 */

module.exports = {
  '/api/v1/common/dashboard': {
    get: {
      tags: ['Dashboard'],
      summary: 'Get Real-Time Hotel & Restaurant Dashboard Metrics',
      description: `
**Database Execution & Flow**:
- **Tables Queried**: \`mpos_tables\`, \`mpos_orders\`, \`mpos_table_reservations\`, \`mpos_rooms\`
- **Aggregations Run**:
  \`SELECT COUNT(*) FROM mpos_tables WHERE order_state = 'KOT_CUT'\`
  \`SELECT SUM(grand_total) FROM mpos_orders WHERE DATE(created_at) = CURRENT_DATE\`
- Returns occupancy counters, gross daily sales, pending KOT count, and table grid summary.
      `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Dashboard analytics summary retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'integer', example: 200 },
                  data: {
                    type: 'object',
                    properties: {
                      todaySales: { type: 'number', example: 45200.50 },
                      occupiedTables: { type: 'integer', example: 6 },
                      availableTables: { type: 'integer', example: 14 },
                      pendingKots: { type: 'integer', example: 3 },
                      activeReservations: { type: 'integer', example: 5 }
                    }
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
