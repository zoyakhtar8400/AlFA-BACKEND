/* eslint-disable prefer-rest-params */
/* eslint-disable no-param-reassign */
/* eslint-disable no-plusplus */
/* eslint-disable func-names */
const RetryOperation = require('./retry_operation');

exports.operation = function (options) {
  const timeouts = exports.timeouts(options);
  return new RetryOperation(timeouts, {
    forever: options && (options.forever || options.retries === Infinity),
    unref: options && options.unref,
    maxRetryTime: options && options.maxRetryTime,
  });
};

exports.timeouts = function (options) {
  if (options instanceof Array) {
    return [].concat(options);
  }

  const opts = {
    retries: 10,
    factor: 2,
    minTimeout: 1 * 1000,
    maxTimeout: Infinity,
    randomize: false,
  };
  // eslint-disable-next-line no-restricted-syntax, guard-for-in
  for (const key in options) {
    opts[key] = options[key];
  }

  if (opts.minTimeout > opts.maxTimeout) {
    throw new Error('minTimeout is greater than maxTimeout');
  }

  const timeouts = [];
  // eslint-disable-next-line no-plusplus, vars-on-top, no-var
  for (var i = 0; i < opts.retries; i++) {
    timeouts.push(this.createTimeout(i, opts));
  }

  if (options && options.forever && !timeouts.length) {
    // eslint-disable-next-line no-undef, block-scoped-var
    timeouts.push(this.createTimeout(i, opts));
  }

  // sort the array numerically ascending
  timeouts.sort((a, b) => a - b);

  return timeouts;
};

exports.createTimeout = function (attempt, opts) {
  const random = opts.randomize ? Math.random() + 1 : 1;

  let timeout = Math.round(
    random * Math.max(opts.minTimeout, 1) * opts.factor ** attempt,
  );
  timeout = Math.min(timeout, opts.maxTimeout);

  return timeout;
};

exports.wrap = function (obj, options, methods) {
  if (options instanceof Array) {
    // eslint-disable-next-line no-param-reassign
    methods = options;
    // eslint-disable-next-line no-param-reassign
    options = null;
  }

  if (!methods) {
    // eslint-disable-next-line no-param-reassign
    methods = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const key in obj) {
      if (typeof obj[key] === 'function') {
        methods.push(key);
      }
    }
  }

  for (let i = 0; i < methods.length; i++) {
    const method = methods[i];
    const original = obj[method];

    // eslint-disable-next-line no-shadow
    obj[method] = function retryWrapper(original) {
      const op = exports.operation(options);
      // eslint-disable-next-line prefer-rest-params
      const args = Array.prototype.slice.call(arguments, 1);
      const callback = args.pop();

      args.push(function (err) {
        if (op.retry(err)) {
          return;
        }
        if (err) {
          // eslint-disable-next-line prefer-rest-params
          arguments[0] = op.mainError();
        }
        callback.apply(this, arguments);
      });

      op.attempt(() => {
        original.apply(obj, args);
      });
    }.bind(obj, original);
    obj[method].options = options;
  }
};
