/**
 * Circuit Breaker Pattern Implementation
 * Защита от сбоев внешних сервисов
 */

class CircuitBreaker {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30 секунд
    this.state = 'CLOSED'; // CLOSED → OPEN → HALF_OPEN
    this.failures = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
  }

  async call(asyncFunction, ...args) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker OPEN for ${this.serviceName}. Next attempt at ${new Date(this.nextAttempt).toISOString()}`);
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await asyncFunction(...args);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      console.warn(`Circuit breaker OPEN for ${this.serviceName} after ${this.failures} failures`);
    }
  }

  getState() {
    return {
      service: this.serviceName,
      state: this.state,
      failures: this.failures,
      nextAttempt: this.nextAttempt ? new Date(this.nextAttempt).toISOString() : null,
    };
  }
}

// Singleton instances для внешних сервисов
const circuitBreakers = {
  yandexGeo: new CircuitBreaker('YandexGeoAPI', {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 минута
  }),
  yandexMaps: new CircuitBreaker('YandexMapsAPI', {
    failureThreshold: 3,
    resetTimeout: 30000, // 30 секунд
  }),
};

module.exports = {
  CircuitBreaker,
  circuitBreakers,
};
