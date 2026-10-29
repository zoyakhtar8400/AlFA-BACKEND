const express = require('express');
const { ResponseMessage } = require('../error/ResponseMessage');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Config } = require('../config/config');
const { verifyPassword, hashPassword } = require('../util/passwordUtils');
const { auth } = require('../middleware/auth');

const loginAttempts = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5;

function getRateLimitKey(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown';
}

function checkRateLimit(req, res) {
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }
  const key = getRateLimitKey(req);
  const now = Date.now();
  const entry = loginAttempts.get(key);

  if (entry && now < entry.resetAt) {
    if (entry.count >= RATE_LIMIT_MAX) {
      const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfterSec));
      res.status(429).json(new ResponseMessage(429,
        `Too many login attempts. Please try again in ${Math.ceil(retryAfterSec / 60)} minute(s).`
      ));
      return false;
    }
    entry.count += 1;
  } else {
    loginAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }
  return true;
}

function recordLoginSuccess(req) {
  loginAttempts.delete(getRateLimitKey(req));
}

// Prune stale entries every 30 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of loginAttempts) {
    if (now >= entry.resetAt) loginAttempts.delete(key);
  }
}, 30 * 60 * 1000);

/**
 * Production-grade PostgreSQL User Authentication
 */
async function authenticateUser(postData) {
  const response = new ResponseMessage();
  const usernameInput = (postData.username || postData.email || '').trim();
  const passwordInput = postData.password || '';

  if (!usernameInput || !passwordInput) {
    response.setStatus(400);
    response.setMessage('Username and password are required');
    return response;
  }

  try {
    const userModel = global.serverdbConnection.User;
    let userRecord = await userModel.findOne({
      where: { username: usernameInput },
      raw: false
    });

    if (!userRecord) {
      // Fallback search by email column
      userRecord = await userModel.findOne({
        where: { email: usernameInput },
        raw: false
      });
    }

    if (userRecord) {
      const user = userRecord.toJSON ? userRecord.toJSON() : userRecord;

      // Reject Inactive accounts
      if (user.status !== 1 && user.status !== '1' && user.status !== true) {
        response.setStatus(401);
        response.setMessage('Account is inactive. Please contact your system administrator.');
        return response;
      }

      const isValidPassword = verifyPassword(passwordInput, user.password);

      if (isValidPassword) {
        // Auto-upgrade legacy plaintext or AES password to PBKDF2 salt:hash in PostgreSQL
        if (!user.password.includes(':') && !user.password.startsWith('$2')) {
          try {
            const upgradedHash = hashPassword(passwordInput);
            await userModel.update(
              { password: upgradedHash },
              { where: { id: user.id } }
            );
          } catch (e) {
            console.warn('Auto password hash upgrade error:', e.message);
          }
        }

        let roleName = String(user.type || user.userCategory || '').toUpperCase();
        if (!roleName || roleName === 'USER' || String(user.username).toLowerCase() === 'admin') {
          roleName = (String(user.username).toLowerCase() === 'admin' || !roleName) ? 'ADMIN' : roleName;
        }
        const jwtSecret = Config.JWT_SECRET || process.env.JWT_SECRET;

        // Fetch stores/outlets for multi-outlet authorization
        let outletList = [];
        try {
          const storeModel = global.serverdbConnection.Store;
          const userOutletModel = global.serverdbConnection.UserOutlet;

          if (roleName === 'ADMIN') {
            // ADMIN gets access to ALL active outlets
            const allStores = await storeModel.findAll({ raw: true });
            outletList = allStores.map(s => ({
              id: s.id,
              store_id: s.store_id || `STORE_${s.id}`,
              name: s.store_name || `Outlet ${s.id}`
            }));
          } else if (userOutletModel) {
            // STAFF gets access to mapped outlets in mpos_user_outlet
            const mappedUserOutlets = await userOutletModel.findAll({
              where: { user_id: user.id },
              raw: true
            });
            if (mappedUserOutlets.length > 0) {
              const mappedStoreIds = mappedUserOutlets.map(m => m.store_id);
              const matchedStores = await storeModel.findAll({
                where: { store_id: mappedStoreIds },
                raw: true
              });
              outletList = matchedStores.map(s => ({
                id: s.id,
                store_id: s.store_id || `STORE_${s.id}`,
                name: s.store_name || `Outlet ${s.id}`
              }));
            }
          }
        } catch (storeErr) {
          console.warn('Store fetch error during login:', storeErr.message);
        }

        if (outletList.length === 0) {
          outletList = [{ id: 1, store_id: user.store_id || 'STORE_1', name: 'Main Restaurant' }];
        }

        const assignedStoreIds = outletList.map(o => o.store_id);

        const token = jwt.sign(
          {
            id: user.id,
            username: user.username,
            role: roleName,
            type: roleName,
            store_id: assignedStoreIds[0] || 'STORE_1',
            assigned_outlets: assignedStoreIds
          },
          jwtSecret,
          { expiresIn: '8h' }
        );

        response.setStatus(200);
        response.setMessage('Success');
        response.token = token;
        response.outlets = outletList;
        response.user = {
          id: user.id,
          username: user.username,
          email: user.email || '',
          name: user.name || user.username,
          role: roleName,
          type: roleName,
          status: user.status === 1 ? 'Active' : 'Inactive',
          store_id: assignedStoreIds[0] || 'STORE_1',
          assigned_outlets: assignedStoreIds
        };
        response.data = response.user;
        return response;
      }
    }

    response.setStatus(401);
    response.setMessage('Invalid username or password.');
  } catch (error) {
    console.error('Error in authenticateUser:', error);
    response.setStatus(401);
    response.setMessage('Authentication failed. Invalid username or password.');
  }

  return response;
}

// POST /login, POST /api/login, POST /api/auth/login
const handleLoginReq = async (req, res) => {
  if (!checkRateLimit(req, res)) return;
  try {
    const postData = req.body || {};
    const result = await authenticateUser(postData);
    if (result.status === 200) recordLoginSuccess(req);
    return res.status(result.status || (result.statusCode >= 400 ? result.statusCode : 200)).json(result);
  } catch (error) {
    console.error('Login Route Error:', error);
    return res.status(401).json(new ResponseMessage(401, 'Authentication failed'));
  }
};

router.post('/login', handleLoginReq);
router.post('/api/login', handleLoginReq);
router.post('/api/auth/login', handleLoginReq);

// GET /api/auth/me — verify token and return current user from PostgreSQL
router.get('/api/auth/me', auth, async (req, res) => {
  try {
    const userModel = global.serverdbConnection.User;
    const user = await userModel.findByPk(req.user.id, { raw: true });

    if (!user) {
      return res.status(401).json(new ResponseMessage(401, 'User not found'));
    }

    if (user.status !== 1 && user.status !== '1') {
      return res.status(401).json(new ResponseMessage(401, 'Account is inactive'));
    }

    const roleName = String(user.type || user.userCategory || 'USER').toUpperCase();
    return res.status(200).json({
      status: 200,
      user: {
        id: user.id,
        username: user.username,
        email: user.email || '',
        name: user.name || user.username,
        role: roleName,
        type: roleName,
        status: 'Active',
        store_id: user.store_id || 'STORE_1'
      }
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return res.status(401).json(new ResponseMessage(401, 'Token verification failed'));
  }
});

const handleLogoutReq = async (req, res) => {
  try {
    const postData = req.body || req.query || {};
    const username = postData.username || req.user?.username;
    if (username && global.serverdbConnection.UserLoginStatus) {
      await global.serverdbConnection.UserLoginStatus.update(
        { status: 0 },
        { where: { username: username } }
      ).catch(() => {});
    }
    return res.status(200).json(new ResponseMessage(200, 'Logged out successfully'));
  } catch (error) {
    return res.status(200).json(new ResponseMessage(200, 'Logged out successfully'));
  }
};

router.post('/logout', handleLogoutReq);
router.post('/api/logout', handleLogoutReq);
router.get('/logout', handleLogoutReq);
router.get('/api/logout', handleLogoutReq);

router.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

module.exports = router;
