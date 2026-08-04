/**
 * Reusable Query & Path Parameters for OpenAPI Documentation
 */

module.exports = {
  IdParam: {
    name: 'id',
    in: 'path',
    required: true,
    description: 'Unique database primary key ID or custom reference string',
    schema: { type: 'string', example: '1' }
  },
  TableIdParam: {
    name: 'tableId',
    in: 'path',
    required: true,
    description: 'Database Table primary key ID',
    schema: { type: 'integer', example: 1 }
  },
  KotIdParam: {
    name: 'kotId',
    in: 'path',
    required: true,
    description: 'KOT ID or custom bill string',
    schema: { type: 'string', example: 'KOT-104' }
  },
  OrderIdParam: {
    name: 'orderId',
    in: 'path',
    required: true,
    description: 'Order primary key ID',
    schema: { type: 'string', example: '35' }
  },
  PageQuery: {
    name: 'page',
    in: 'query',
    required: false,
    description: 'Page number for paginated queries (default: 1)',
    schema: { type: 'integer', example: 1 }
  },
  LimitQuery: {
    name: 'limit',
    in: 'query',
    required: false,
    description: 'Number of records per page (default: 10)',
    schema: { type: 'integer', example: 10 }
  },
  SearchQuery: {
    name: 'search',
    in: 'query',
    required: false,
    description: 'Search string filter across names, phones, or reference codes',
    schema: { type: 'string', example: 'John' }
  },
  StatusQuery: {
    name: 'status',
    in: 'query',
    required: false,
    description: 'Filter by record status',
    schema: { type: 'string', example: 'Reserved' }
  }
};
