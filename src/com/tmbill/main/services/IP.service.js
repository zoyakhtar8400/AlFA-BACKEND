const { default: axios } = require('axios');

const TIMEOUT_MS = 10000;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── In-memory cache ─────────────────────────────────────────────────────────

const cache = new Map();

const getCached = (key) => {
  const entry = cache.get(key);
  if (!entry || Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
};

const setCache = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

// ─── HTTP helper ─────────────────────────────────────────────────────────────

async function safeFetch(url, opts = {}) {
  try {
    const isText = opts.text === true;
    const response = await axios.get(url, {
      timeout: TIMEOUT_MS, // Axios handles the AbortController/timer logic internally
      headers: {
        'User-Agent': 'geo-ip-service/1.0',
        Accept: 'application/json',
      },
      responseType: isText ? 'text' : 'json',
    });

    // Axios automatically throws for non-2xx statuses and parses JSON
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timed out');
    }
    throw new Error(
      `HTTP ${error.response?.status || 'Network Error'}: ${error.message}`,
    );
  }
}

// ─── Retry delay (only fires for attempt > 0) ────────────────────────────────
//
// attempt=0 resolves immediately so the first try has zero overhead.
// attempt=1 → ~300–600 ms, attempt=2 → ~600–900 ms, etc.

const retryDelay = (attempt) => {
  if (attempt === 0) return Promise.resolve();

  const base = 300 * 2 ** attempt;
  const jitter = Math.random() * 300;

  return new Promise((resolve) => {
    setTimeout(resolve, base + jitter);
  });
};

// ─── Private IP guard ────────────────────────────────────────────────────────

const PRIVATE_IP_RE =
  /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|127\.|169\.254\.|::1|fc|fd)/;

const isPrivateIP = (ip) => ip !== '' && PRIVATE_IP_RE.test(ip);

// ─── Normalised result shape ──────────────────────────────────────────────────

const EMPTY_RESULT = {
  provider: 'none',
  ip: '',
  city: '',
  region: '',
  country: '',
  countryCode: '',
  postal: '',
  latitude: null,
  longitude: null,
  timezone: '',
  utcOffset: '',
  isp: '',
  org: '',
  asn: '',
  display: 'Unknown',
  errors: [],
};

const makeResult = (overrides) => ({ ...EMPTY_RESULT, ...overrides });

const withDisplay = (result) => ({
  ...result,
  display:
    [result.city, result.country].filter(Boolean).join(', ') || 'Unknown',
});

// ─── Provider adapters ────────────────────────────────────────────────────────
//

const fromCloudflareTrace = (ip, attempt) =>
  retryDelay(attempt).then(() =>
    safeFetch('https://1.1.1.1/cdn-cgi/trace').then((raw) => {
      // raw is TEXT, not JSON → fix safeFetch or bypass it
      if (typeof raw !== 'string') {
        throw new Error('Unexpected response format');
      }

      const parsed = Object.fromEntries(
        raw
          .split('\n')
          .map((line) => line.split('='))
          .filter(([k, v]) => k && v),
      );

      if (!parsed.ip) {
        throw new Error('Cloudflare trace failed');
      }

      return makeResult({
        provider: 'cloudflare-trace',
        ip: parsed.ip || '',
        countryCode: parsed.loc || '',
        timezone: '',

        // Not available
        city: '',
        region: '',
        country: '',

        // Use network metadata as ISP-like signal
        isp: `colo:${parsed.colo || ''}`,
        org: `http:${parsed.http || ''}`,

        asn: parsed.kex || '', // optional: crypto fingerprint

        // You may want to store extra raw metadata separately
        _meta: {
          colo: parsed.colo,
          tls: parsed.tls,
          http: parsed.http,
          warp: parsed.warp,
        },
      });
    }),
  );

const fromIpApiCo = (ip, attempt) =>
  retryDelay(attempt).then(() =>
    safeFetch(
      ip ? `https://ipapi.co/${ip}/json` : 'https://ipapi.co/json',
    ).then((raw) => {
      if (raw.error || raw.reason) {
        throw new Error(raw.reason || raw.error || 'ipapi.co failed');
      }
      return makeResult({
        provider: 'ipapi.co',
        ip: raw.ip || '',
        city: raw.city || '',
        region: raw.region || '',
        country: raw.country_name || '',
        countryCode: raw.country || '',
        postal: raw.postal || '',
        latitude: typeof raw.latitude === 'number' ? raw.latitude : null,
        longitude: typeof raw.longitude === 'number' ? raw.longitude : null,
        timezone: raw.timezone || '',
        isp: raw.org || '',
        org: raw.org || '',
        asn: raw.asn || '',
      });
    }),
  );

const fromIpWhoIs = (ip, attempt) =>
  retryDelay(attempt).then(() =>
    safeFetch(ip ? `https://ipwho.is/${ip}` : 'https://ipwho.is/').then(
      (raw) => {
        if (!raw.success) throw new Error(raw.message || 'ipwho.is failed');
        return makeResult({
          provider: 'ipwho.is',
          ip: raw.ip || '',
          city: raw.city || '',
          region: raw.region || '',
          country: raw.country || '',
          countryCode: raw.country_code || '',
          postal: raw.postal || '',
          latitude: typeof raw.latitude === 'number' ? raw.latitude : null,
          longitude: typeof raw.longitude === 'number' ? raw.longitude : null,
          timezone: (raw.timezone && raw.timezone.id) || '',
          utcOffset: (raw.timezone && raw.timezone.utc) || '',
          isp: (raw.connection && raw.connection.isp) || '',
          org: (raw.connection && raw.connection.org) || '',
          asn:
            raw.connection && raw.connection.asn
              ? `AS${raw.connection.asn}`
              : '',
        });
      },
    ),
  );

const fromIpInfo = (ip, attempt) =>
  retryDelay(attempt).then(() =>
    safeFetch(
      ip ? `https://ipinfo.io/${ip}/json` : 'https://ipinfo.io/json',
    ).then((raw) => {
      if (raw.error)
        throw new Error((raw.error && raw.error.message) || 'ipinfo.io failed');
      const parts = (raw.loc || '').split(',').map(Number);
      return makeResult({
        provider: 'ipinfo.io',
        ip: raw.ip || '',
        city: raw.city || '',
        region: raw.region || '',
        country: raw.country || '',
        countryCode: raw.country || '',
        postal: raw.postal || '',
        latitude: Number.isFinite(parts[0]) ? parts[0] : null,
        longitude: Number.isFinite(parts[1]) ? parts[1] : null,
        timezone: raw.timezone || '',
        isp: raw.org || '',
        org: raw.org || '',
        asn: (raw.org || '').split(' ')[0] || '',
      });
    }),
  );

const fromFreeIpApi = (ip, attempt) =>
  retryDelay(attempt).then(() =>
    safeFetch(
      ip
        ? `https://freeipapi.com/api/json/${ip}`
        : 'https://freeipapi.com/api/json',
    ).then((raw) => {
      if (!raw.ipAddress)
        throw new Error(raw.error || 'freeipapi.com: no ipAddress');
      return makeResult({
        provider: 'freeipapi.com',
        ip: raw.ipAddress || '',
        city: raw.cityName || '',
        region: raw.regionName || '',
        country: raw.countryName || '',
        countryCode: raw.countryCode || '',
        postal: raw.zipCode || '',
        latitude: typeof raw.latitude === 'number' ? raw.latitude : null,
        longitude: typeof raw.longitude === 'number' ? raw.longitude : null,
        timezone: raw.timeZone || '',
        utcOffset: raw.utcOffset || '',
      });
    }),
  );

// HTTP only on free tier — use last; suitable for internal/private networks
const fromIpApi = (ip, attempt) =>
  retryDelay(attempt).then(() =>
    safeFetch(
      `http://ip-api.com/json/${ip || ''}?fields=status,message,query,city,regionName,country,countryCode,zip,lat,lon,timezone,isp,org,as`,
    ).then((raw) => {
      if (raw.status !== 'success')
        throw new Error(raw.message || `ip-api.com: ${raw.status}`);
      return makeResult({
        provider: 'ip-api.com',
        ip: raw.query || '',
        city: raw.city || '',
        region: raw.regionName || '',
        country: raw.country || '',
        countryCode: raw.countryCode || '',
        postal: raw.zip || '',
        latitude: typeof raw.lat === 'number' ? raw.lat : null,
        longitude: typeof raw.lon === 'number' ? raw.lon : null,
        timezone: raw.timezone || '',
        isp: raw.isp || '',
        org: raw.org || '',
        asn: raw.as || '',
      });
    }),
  );

const fromCountryIs = (ip, attempt) =>
  retryDelay(attempt).then(() =>
    safeFetch(
      ip
        ? `https://api.country.is/${ip}?fields=city,continent,subdivision,postal,location,asn`
        : `https://api.country.is/?fields=city,continent,subdivision,postal,location,asn`,
    ).then((raw) => {
      if (!raw || !raw.ip) {
        throw new Error('country.is failed');
      }

      return makeResult({
        provider: 'country.is',
        ip: raw.ip || '',
        city: raw.city || '',
        region: raw.subdivision || '', // MH (state code)
        country: raw.country || '',
        countryCode: raw.country || '',
        postal: raw.postal || '',
        latitude:
          typeof raw.location?.latitude === 'number'
            ? raw.location.latitude
            : null,
        longitude:
          typeof raw.location?.longitude === 'number'
            ? raw.location.longitude
            : null,
        timezone: raw.location?.time_zone || '',
        isp: raw.asn?.organization || '',
        org: raw.asn?.organization || '',
        asn: raw.asn?.number ? `AS${raw.asn.number}` : '',
      });
    }),
  );

const fromIpBase = (ip, attempt) =>
  retryDelay(attempt).then(() =>
    safeFetch(
      ip
        ? `https://api.ipbase.com/v2/info?ip=${ip}`
        : 'https://api.ipbase.com/v2/info',
    ).then((raw) => {
      if (!raw || !raw.data) {
        throw new Error('ipbase failed');
      }

      const d = raw.data;

      return makeResult({
        provider: 'ipbase.com',

        ip: d.ip || '',

        city: d.location?.city?.name || '',
        region: d.location?.region?.name || '',
        country: d.location?.country?.name || '',
        countryCode: d.location?.country?.alpha2 || '',

        postal: d.location?.zip || '',

        latitude:
          typeof d.location?.latitude === 'number' ? d.location.latitude : null,

        longitude:
          typeof d.location?.longitude === 'number'
            ? d.location.longitude
            : null,

        timezone: d.timezone?.id || '',

        isp: d.connection?.isp || '',
        org: d.connection?.organization || '',

        asn:
          d.connection?.asn && d.connection.asn !== 0
            ? `AS${d.connection.asn}`
            : '',
      });
    }),
  );

// ─── Provider registry ────────────────────────────────────────────────────────
//
// Keyed by the canonical name used in opts.providers.
// Each entry carries { name, fn } so the name travels with the function
// and never has to be derived from fn.name (which is fragile after minification).

const PROVIDER_MAP = {
  'ipapi.co': { name: 'ipapi.co', fn: fromIpApiCo },
  'ipwho.is': { name: 'ipwho.is', fn: fromIpWhoIs },
  'ipinfo.io': { name: 'ipinfo.io', fn: fromIpInfo },
  'freeipapi.com': { name: 'freeipapi.com', fn: fromFreeIpApi },
  'ip-api.com': { name: 'ip-api.com', fn: fromIpApi },
  'country.is': { name: 'country.is', fn: fromCountryIs },
  'ipbase.com': { name: 'ipbase.com', fn: fromIpBase },
  'cloudflare-trace': { name: 'cloudflare-trace', fn: fromCloudflareTrace },
};

const DEFAULT_ORDER = [
  'ipapi.co',
  'ipwho.is',
  'ipinfo.io',
  'cloudflare-trace',
  'ipbase.com',
  'country.is',
  'freeipapi.com',
  'ip-api.com',
];

// ─── Waterfall via Array.reduce ───────────────────────────────────────────────
//
// Seed is Promise.reject([]) — an empty array — so every .catch receives a
// consistent string[] and Array.isArray() is always true from step one.

function waterfall(providers, ip, verbose, attempt) {
  return providers.reduce(
    (chain, provider) =>
      chain.catch((collectedErrors) => {
        if (verbose) console.log(`[geo-ip] trying ${provider.name}…`);

        return provider
          .fn(ip, attempt)
          .then((result) => {
            if (verbose) console.log(`[geo-ip] success via ${result.provider}`);
            return result;
          })
          .catch((err) => {
            const msg = `${provider.name}: ${err.message}`;
            if (verbose) console.warn(`[geo-ip] failed — ${msg}`);
            return Promise.reject(
              Array.isArray(collectedErrors)
                ? collectedErrors.concat(msg)
                : [msg],
            );
          });
      }),
    Promise.reject(Object.assign(new Error('Initial failure'), { errors: [] })), // ← consistent empty-array seed
  );
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Resolves IP geolocation by trying each provider in priority order.
 * Always resolves — never rejects.
 *
 * @param {string}   [ip]              - Target IP. Pass '' or omit to resolve the caller's IP.
 * @param {object}   [opts]
 * @param {string[]} [opts.providers]  - Ordered provider subset. Defaults to DEFAULT_ORDER.
 * @param {boolean}  [opts.verbose]    - Log provider attempts to console.
 * @param {number}   [opts.attempt]    - Retry attempt index (default 0, no delay).
 * @returns {Promise<GeoResult>}
 *
 * @typedef {object} GeoResult
 * @property {string}      provider
 * @property {string}      ip
 * @property {string}      city
 * @property {string}      region
 * @property {string}      country
 * @property {string}      countryCode
 * @property {string}      postal
 * @property {number|null} latitude
 * @property {number|null} longitude
 * @property {string}      timezone
 * @property {string}      utcOffset
 * @property {string}      isp
 * @property {string}      org
 * @property {string}      asn
 * @property {string}      display
 * @property {string[]}    errors
 */
function resolveGeoIp(ip, opts) {
  const options = opts || {};
  const verbose = Boolean(options.verbose);
  const attempt = typeof options.attempt === 'number' ? options.attempt : 0;
  const names =
    Array.isArray(options.providers) && options.providers.length
      ? options.providers
      : DEFAULT_ORDER;

  // '' means "caller's own public IP"; use as cache key too
  const resolvedIp = ip && typeof ip === 'string' ? ip.trim() : '';
  const cacheKey = resolvedIp || 'self';

  if (isPrivateIP(resolvedIp)) {
    return Promise.resolve(
      makeResult({
        ip: resolvedIp,
        errors: ['Private IP — cannot geolocate publicly'],
      }),
    );
  }

  const cached = getCached(cacheKey);
  if (cached) {
    if (verbose) console.log(`[geo-ip] cache hit for ${cacheKey}`);
    return Promise.resolve(cached);
  }

  const providers = names
    .filter((name) => Object.prototype.hasOwnProperty.call(PROVIDER_MAP, name))
    .map((name) => PROVIDER_MAP[name]);

  if (!providers.length) {
    return Promise.resolve(
      makeResult({ errors: ['resolveGeoIp: no valid providers specified'] }),
    );
  }

  return waterfall(providers, resolvedIp, verbose, attempt)
    .then(withDisplay)
    .then((result) => {
      if (result.provider !== 'none') setCache(cacheKey, result);
      return result;
    })
    .catch((errors) => {
      console.error('[geo-ip] all providers failed:', errors);
      return makeResult({
        ip: resolvedIp,
        errors: Array.isArray(errors) ? errors : [String(errors)],
      });
    });
}

module.exports = { resolveGeoIp };
