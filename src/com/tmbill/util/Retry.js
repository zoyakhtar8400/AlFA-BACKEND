function retryWithExponentialBackoff(
  checkCondition,
  maxRetries,
  baseDelay,
  maxDelay,
) {
  return new Promise((resolve, reject) => {
    let retryCount = 0;

    const retry = () => {
      if (retryCount >= maxRetries) {
        reject(new Error('Max retries reached'));
        return;
      }

      if (checkCondition()) {
        resolve();
        return;
      }

      // eslint-disable-next-line no-restricted-properties, prefer-exponentiation-operator
      const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
      retryCount += 1;

      setTimeout(() => {
        retry();
      }, delay);
    };

    retry();
  });
}

module.exports = {
  retryWithExponentialBackoff,
};
