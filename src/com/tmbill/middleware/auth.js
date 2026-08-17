const jwt = require('jsonwebtoken');
const { ResponseMessage } = require('../error/ResponseMessage');
const { Config } = require('../config/config');

/**
 * Production-grade JWT Authentication Middleware with backward compatibility support
 */
const auth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'] || req.headers['x-access-token'];
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (authHeader) {
      token = authHeader;
    }

    if (!token) {
      const resp = new ResponseMessage(401, 'Unauthorized: Access token missing or invalid');
      resp.setStatus(401);
      return res.status(401).json(resp);
    }

    const jwtSecret = Config.JWT_SECRET || process.env.JWT_SECRET;
    if (!jwtSecret) {
      const resp = new ResponseMessage(500, 'Server misconfiguration: JWT secret not set');
      return res.status(500).json(resp);
    }
    const decoded = jwt.verify(token, jwtSecret);

    req.user = {
      id: decoded.id,
      username: decoded.username,
      role: String(decoded.role || decoded.type || 'USER').toUpperCase(),
      type: String(decoded.role || decoded.type || 'USER').toUpperCase(),
      store_id: decoded.store_id || 'STORE_1',
      assigned_outlets: Array.isArray(decoded.assigned_outlets) ? decoded.assigned_outlets : [decoded.store_id || 'STORE_1']
    };

    return next();
  } catch (err) {
    const resp = new ResponseMessage(401, 'Unauthorized: Invalid or expired token');
    resp.setStatus(401);
    return res.status(401).json(resp);
  }
};

/**
 * Role-based Authorization Middleware
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      const resp = new ResponseMessage(401, 'Unauthorized: User identity not found');
      resp.setStatus(401);
      return res.status(401).json(resp);
    }

    const userRole = String(req.user.role || req.user.type || '').toUpperCase();
    const username = String(req.user.username || '').toLowerCase();
    const upperAllowed = allowedRoles.map(r => String(r).toUpperCase());

    // Universal override for system administrator account or ADMIN role
    if (userRole === 'ADMIN' || username === 'admin' || upperAllowed.includes(userRole)) {
      return next();
    }



    if (!upperAllowed.includes(userRole)) {
      const resp = new ResponseMessage(403, 'Forbidden: Insufficient permissions');
      resp.setStatus(403);
      return res.status(403).json(resp);
    }

    return next();
  };
};

/**
 * Role & Outlet Authorization Middleware
 * Enforces outlet access permissions at backend API level.
 */
const authorizeOutlet = async (req, res, next) => {
  if (!req.user) {
    const resp = new ResponseMessage(401, 'Unauthorized: User identity not found');
    return res.status(401).json(resp);
  }

  const userRole = String(req.user.role || req.user.type || '').toUpperCase();
  const username = String(req.user.username || '').toLowerCase();
  
  // ADMIN role or 'admin' account has universal access to all outlets
  if (userRole === 'ADMIN' || username === 'admin') {
    return next();
  }

  // Target store_id requested in query, params, or body
  const targetOutlet = req.query.outletId || req.query.store_id || req.body.outletId || req.body.store_id || req.params.store_id;
  if (!targetOutlet) {
    return next();
  }

  try {
    // Check if user has explicit outlet restrictions in PostgreSQL mpos_user_outlet
    if (global.serverdbConnection && global.serverdbConnection.UserOutlet) {
      const userOutlets = await global.serverdbConnection.UserOutlet.findAll({
        where: { user_id: req.user.id }
      });

      if (userOutlets && userOutlets.length > 0) {
        const allowedOutlets = userOutlets.map(o => String(o.store_id));
        if (!allowedOutlets.includes(String(targetOutlet))) {
          const resp = new ResponseMessage(403, `Forbidden: Access denied to outlet '${targetOutlet}'. You do not have permission for this outlet.`);
          return res.status(403).json(resp);
        }
      }
    }
  } catch (err) {
    console.error('authorizeOutlet error:', err.message);
  }

  return next();
};

/**
 * Internal service auth — accepts a valid JWT Bearer token OR the shared
 * INTERNAL_SECRET header. Used for Electron IPC routes (/api/v1/*) that are
 * called by captain app / KDS / POS terminal without a user JWT.
 */
const internalAuth = (req, res, next) => {
  // Path 1: valid user JWT (React frontend, authenticated users)
  const authHeader = req.headers['authorization'] || req.headers['x-access-token'];
  const internalSecret = process.env.INTERNAL_SECRET;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const jwtSecret = Config.JWT_SECRET || process.env.JWT_SECRET;
    if (jwtSecret) {
      try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = {
          id: decoded.id,
          username: decoded.username,
          role: String(decoded.role || decoded.type || 'USER').toUpperCase(),
          type: String(decoded.role || decoded.type || 'USER').toUpperCase(),
          store_id: decoded.store_id || 'STORE_1',
          assigned_outlets: Array.isArray(decoded.assigned_outlets) ? decoded.assigned_outlets : [decoded.store_id || 'STORE_1']
        };
        return next();
      } catch (e) {
        // fall through to internal secret check
      }
    }
  }

  // Path 2: shared internal secret (Electron IPC clients — captain app, KDS, terminal)
  if (internalSecret) {
    const provided = req.headers['x-internal-secret'];
    if (provided && provided === internalSecret) {
      req.user = { id: 0, username: 'internal', role: 'INTERNAL', type: 'INTERNAL', store_id: 'STORE_1', assigned_outlets: ['STORE_1'] };
      return next();
    }
  }

  // Path 3: same-process Electron call (no network hop, loopback only)
  const remoteAddr = req.socket.remoteAddress || '';
  const isLoopback = remoteAddr === '127.0.0.1' || remoteAddr === '::1' || remoteAddr === '::ffff:127.0.0.1';
  if (isLoopback && !internalSecret) {
    req.user = { id: 0, username: 'internal', role: 'INTERNAL', type: 'INTERNAL', store_id: 'STORE_1', assigned_outlets: ['STORE_1'] };
    return next();
  }

  const resp = new ResponseMessage(401, 'Unauthorized: Access token or internal secret required');
  return res.status(401).json(resp);
};

const socketAuth = (socket, next) => {
  next();
};

const localAuth = (req, res, next) => {
  next();
};

async function isPOSUserLoggedIn(req, res, next) {
  next();
}

module.exports = {
  auth,
  authorize,
  authorizeOutlet,
  socketAuth,
  isPOSUserLoggedIn,
  localAuth,
  internalAuth,
};
