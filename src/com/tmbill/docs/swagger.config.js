/**
 * ALFA Hotel Management System - Swagger / OpenAPI Master Config
 */

module.exports = {
  openapi: '3.0.3',
  info: {
    title: 'ALFA Hotel Management System - API Reference',
    version: '1.0.0',
    description: 'Official REST API documentation for ALFA Hotel Management System. Authenticate using JWT Bearer token via the **Authorize** button.',
    contact: {
      name: 'ALFA Technical Support',
      email: 'support@alfahms.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:8000',
      description: 'Local Development Server'
    },
    {
      url: 'http://localhost:8080',
      description: 'Local Staging Server'
    },
    {
      url: 'https://api.alfahms.com',
      description: 'Production Live Cloud Server'
    }
  ],
  tags: [
    { name: 'Authentication', description: 'User login, token validation, user profile & session management' },
    { name: 'Dashboard', description: 'Real-time metrics, analytics, room occupancy & revenue summaries' },
    { name: 'Front Desk', description: 'Front desk operations, room assignments & front desk status' },
    { name: 'Restaurant', description: 'Restaurant POS billing, dining room orders & live table ordering' },
    { name: 'Kitchen (KOT)', description: 'Kitchen Order Ticket (KOT) creation, item status tracking & kitchen routing' },
    { name: 'POS Billing', description: 'POS bill settlement, split payments (Cash/Card/UPI) & tax invoices' },
    { name: 'Tables', description: 'Dining table status (AVAILABLE, Running/KOT_CUT, Paid, Cleaning) & grid management' },
    { name: 'Reservations', description: 'Table & room reservations, advance bookings & scheduling' },
    { name: 'Check-In', description: 'Guest registration, room key card issuance & check-in processing' },
    { name: 'Check-Out', description: 'Guest billing settlement, folio clearance & check-out processing' },
    { name: 'Guests', description: 'Guest profiles, stay history, identity documents & preference tracking' },
    { name: 'Housekeeping', description: 'Room cleaning status, task assignments & maintenance logs' },
    { name: 'Inventory', description: 'Raw material stock, item stock levels & stock movement tracking' },
    { name: 'Purchase', description: 'Purchase orders, vendor management & goods receipt notes (GRN)' },
    { name: 'Billing', description: 'Invoice generation, tax summaries, discount management & ledger' },
    { name: 'Reports', description: 'Sales reports, KOT logs, GST reports, revenue analytics & export data' },
    { name: 'Masters', description: 'System masters: Categories, Menu Catalog, Departments, Rooms & Taxes' },
    { name: 'Users & Roles', description: 'User management, staff accounts, role permissions & access control' },
    { name: 'Settings', description: 'Terminal configurations, store details, printer settings & system preferences' }
  ]
};
