/**
 * ALFA Hotel Management System - OpenAPI Master Aggregator & Setup
 */

const swaggerUi = require('swagger-ui-express');
const masterConfig = require('./swagger.config');

// Components
const securityComponents = require('./components/security.components');
const responsesComponents = require('./components/responses.components');
const parametersComponents = require('./components/parameters.components');
const schemasComponents = require('./components/schemas.components');

// Modules
const authDocs = require('./modules/auth.swagger');
const dashboardDocs = require('./modules/dashboard.swagger');
const frontdeskDocs = require('./modules/frontdesk.swagger');
const restaurantDocs = require('./modules/restaurant.swagger');
const kotDocs = require('./modules/kot.swagger');
const posbillingDocs = require('./modules/posbilling.swagger');
const tablesDocs = require('./modules/tables.swagger');
const reservationsDocs = require('./modules/reservations.swagger');
const checkinDocs = require('./modules/checkin.swagger');
const checkoutDocs = require('./modules/checkout.swagger');
const guestsDocs = require('./modules/guests.swagger');
const housekeepingDocs = require('./modules/housekeeping.swagger');
const inventoryDocs = require('./modules/inventory.swagger');
const purchaseDocs = require('./modules/purchase.swagger');
const billingDocs = require('./modules/billing.swagger');
const reportsDocs = require('./modules/reports.swagger');
const mastersDocs = require('./modules/masters.swagger');
const usersDocs = require('./modules/users.swagger');
const settingsDocs = require('./modules/settings.swagger');

// Assemble complete OpenAPI Specification
const swaggerSpec = {
  ...masterConfig,
  components: {
    securitySchemes: securityComponents,
    responses: responsesComponents,
    parameters: parametersComponents,
    schemas: schemasComponents
  },
  paths: {
    ...authDocs,
    ...dashboardDocs,
    ...frontdeskDocs,
    ...restaurantDocs,
    ...kotDocs,
    ...posbillingDocs,
    ...tablesDocs,
    ...reservationsDocs,
    ...checkinDocs,
    ...checkoutDocs,
    ...guestsDocs,
    ...housekeepingDocs,
    ...inventoryDocs,
    ...purchaseDocs,
    ...billingDocs,
    ...reportsDocs,
    ...mastersDocs,
    ...usersDocs,
    ...settingsDocs
  }
};

/**
 * Configure Swagger UI middleware on Express App
 * @param {import('express').Application} expressApp 
 */
function setupSwagger(expressApp) {
  // Serve raw JSON OpenAPI schema for integration tools / Postman import
  expressApp.get('/api-docs/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // Custom White Theme & Clean Branding CSS for Swagger UI
  const customWhiteThemeCss = `
    /* Force Light Color Scheme everywhere */
    :root { color-scheme: light !important; }
    
    /* Page & Body White Theme */
    html, body { background-color: #ffffff !important; background: #ffffff !important; color: #0f172a !important; color-scheme: light !important; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; }
    
    .swagger-ui, 
    .swagger-ui *,
    .swagger-ui .wrapper,
    .swagger-ui .info,
    .swagger-ui .scheme-container,
    .swagger-ui .opblock-body,
    .swagger-ui .opblock-section,
    .swagger-ui .opblock-section-header,
    .swagger-ui section.models,
    .swagger-ui .model-container,
    .swagger-ui .dialog-ux .modal-ux {
      background-color: #ffffff !important;
      color: #0f172a !important;
      color-scheme: light !important;
    }

    .swagger-ui { max-width: 1400px; margin: 0 auto; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border-radius: 12px; }
    
    /* Topbar Header Override to Pure White */
    .swagger-ui .topbar { background-color: #ffffff !important; background: #ffffff !important; border-bottom: 2px solid #0e7490 !important; padding: 14px 24px !important; box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important; }
    .swagger-ui .topbar a { display: flex; align-items: center; text-decoration: none; }
    .swagger-ui .topbar a img { display: none !important; }
    .swagger-ui .topbar a::after { content: '🏨 ALFA HMS — Enterprise API Reference' !important; font-size: 1.25rem !important; font-weight: 800 !important; color: #0e7490 !important; letter-spacing: -0.3px; }
    .swagger-ui .topbar .download-url-wrapper { display: flex !important; }
    .swagger-ui .topbar .download-url-wrapper input[type=text] { background: #f8fafc !important; color: #0f172a !important; border: 1px solid #cbd5e1 !important; border-radius: 6px !important; }

    /* Information & Header Section */
    .swagger-ui .info { margin: 24px 0 32px 0 !important; }
    .swagger-ui .info .title { color: #0f172a !important; font-size: 2.2rem !important; font-weight: 900 !important; }
    .swagger-ui .info p, .swagger-ui .info li { color: #334155 !important; font-size: 0.95rem !important; line-height: 1.6 !important; }
    .swagger-ui .info code { background: #f1f5f9 !important; color: #0e7490 !important; padding: 2px 6px !important; border-radius: 4px !important; font-weight: 600 !important; }
    
    /* Authorize Container & Buttons */
    .swagger-ui .scheme-container { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; border-radius: 10px !important; box-shadow: none !important; padding: 16px 20px !important; margin-bottom: 24px !important; }
    .swagger-ui .btn.authorize { color: #ffffff !important; background-color: #0e7490 !important; border-color: #0e7490 !important; border-radius: 8px !important; font-weight: 700 !important; padding: 8px 20px !important; box-shadow: 0 2px 6px rgba(14,116,144,0.3) !important; }
    .swagger-ui .btn.authorize svg { fill: #ffffff !important; }
    .swagger-ui .btn.authorize:hover { background-color: #0c6280 !important; }
    
    /* Category Tags & Sections */
    .swagger-ui .opblock-tag { color: #0f172a !important; font-size: 1.3rem !important; font-weight: 800 !important; border-bottom: 1px solid #cbd5e1 !important; padding: 14px 0 !important; margin-top: 16px !important; }
    .swagger-ui .opblock-tag small { color: #64748b !important; font-weight: 500 !important; font-size: 0.85rem !important; }
    
    /* Operation Blocks Card & Method Colors */
    .swagger-ui .opblock { border-radius: 10px !important; box-shadow: 0 1px 4px rgba(0,0,0,0.04) !important; margin-bottom: 14px !important; }
    .swagger-ui .opblock .opblock-summary { padding: 10px 16px !important; }
    .swagger-ui .opblock .opblock-summary-method { border-radius: 6px !important; font-weight: 800 !important; font-size: 0.82rem !important; min-width: 75px !important; text-align: center !important; color: #ffffff !important; text-shadow: none !important; }
    .swagger-ui .opblock .opblock-summary-path { color: #0f172a !important; font-weight: 700 !important; font-size: 0.92rem !important; }
    .swagger-ui .opblock .opblock-summary-description { color: #475569 !important; font-size: 0.85rem !important; }
    
    /* GET - Blue */
    .swagger-ui .opblock.opblock-get { background: rgba(97, 175, 254, 0.08) !important; border: 1px solid #61afe1 !important; }
    .swagger-ui .opblock.opblock-get .opblock-summary-method { background: #61afe1 !important; }
    .swagger-ui .opblock.opblock-get .opblock-summary { border-color: #61afe1 !important; }
    
    /* POST - Green */
    .swagger-ui .opblock.opblock-post { background: rgba(73, 204, 144, 0.08) !important; border: 1px solid #49cc90 !important; }
    .swagger-ui .opblock.opblock-post .opblock-summary-method { background: #49cc90 !important; }
    .swagger-ui .opblock.opblock-post .opblock-summary { border-color: #49cc90 !important; }
    
    /* PUT - Orange / Amber */
    .swagger-ui .opblock.opblock-put { background: rgba(252, 161, 48, 0.08) !important; border: 1px solid #fca130 !important; }
    .swagger-ui .opblock.opblock-put .opblock-summary-method { background: #fca130 !important; }
    .swagger-ui .opblock.opblock-put .opblock-summary { border-color: #fca130 !important; }
    
    /* DELETE - Red */
    .swagger-ui .opblock.opblock-delete { background: rgba(249, 62, 62, 0.08) !important; border: 1px solid #f93e3e !important; }
    .swagger-ui .opblock.opblock-delete .opblock-summary-method { background: #f93e3e !important; }
    .swagger-ui .opblock.opblock-delete .opblock-summary { border-color: #f93e3e !important; }

    /* PATCH - Teal */
    .swagger-ui .opblock.opblock-patch { background: rgba(80, 227, 194, 0.08) !important; border: 1px solid #50e3c2 !important; }
    .swagger-ui .opblock.opblock-patch .opblock-summary-method { background: #50e3c2 !important; }
    .swagger-ui .opblock.opblock-patch .opblock-summary { border-color: #50e3c2 !important; }
    
    /* Tables, Previews & JSON Blocks */
    .swagger-ui table thead tr th, .swagger-ui table tbody tr td { border-color: #e2e8f0 !important; color: #1e293b !important; }
    .swagger-ui .response-col_status { font-weight: 700 !important; }
    .swagger-ui section.models { border: 1px solid #cbd5e1 !important; border-radius: 10px !important; background: #ffffff !important; }
    .swagger-ui section.models h4 { color: #0f172a !important; font-weight: 800 !important; }
    
    .swagger-ui .highlight-code, .swagger-ui .microlight, .swagger-ui pre { background: #f8fafc !important; color: #0f172a !important; border: 1px solid #e2e8f0 !important; border-radius: 6px !important; }
    .swagger-ui .highlight-code pre, .swagger-ui .microlight code, .swagger-ui pre code, .swagger-ui .opblock-body pre span { color: #0f172a !important; }
  `;

  // Serve Interactive Swagger UI with Custom White Theme
  expressApp.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss: customWhiteThemeCss,
      customSiteTitle: 'ALFA HMS — Enterprise API Reference',
      swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'none',
        filter: true,
        displayRequestDuration: true
      }
    })
  );

  console.log('📖 Swagger/OpenAPI Documentation loaded at: /api-docs');
}

module.exports = {
  swaggerSpec,
  setupSwagger
};
