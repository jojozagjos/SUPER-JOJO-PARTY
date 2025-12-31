/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting request frequency
 */

const rateLimitStore = new Map();

export function createRateLimiter(options = {}) {
  const {
    windowMs = 60000, // 1 minute
    max = 60, // max requests per window
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip || req.connection.remoteAddress
  } = options;

  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Get or create rate limit data
    let limitData = rateLimitStore.get(key);
    
    if (!limitData) {
      limitData = { count: 0, resetTime: now + windowMs };
      rateLimitStore.set(key, limitData);
    }
    
    // Reset if window has passed
    if (now > limitData.resetTime) {
      limitData.count = 0;
      limitData.resetTime = now + windowMs;
    }
    
    // Increment count
    limitData.count++;
    
    // Check limit
    if (limitData.count > max) {
      return res.status(429).json({
        error: message,
        retryAfter: Math.ceil((limitData.resetTime - now) / 1000)
      });
    }
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - limitData.count));
    res.setHeader('X-RateLimit-Reset', new Date(limitData.resetTime).toISOString());
    
    next();
  };
}

// Socket.io rate limiter
export function createSocketRateLimiter(options = {}) {
  const {
    windowMs = 10000, // 10 seconds
    max = 100, // max events per window
    message = 'Too many events'
  } = options;
  
  const limitStore = new Map();
  
  return (socket, next) => {
    const key = socket.id;
    const now = Date.now();
    
    let limitData = limitStore.get(key);
    
    if (!limitData) {
      limitData = { count: 0, resetTime: now + windowMs };
      limitStore.set(key, limitData);
    }
    
    if (now > limitData.resetTime) {
      limitData.count = 0;
      limitData.resetTime = now + windowMs;
    }
    
    limitData.count++;
    
    if (limitData.count > max) {
      socket.emit('error', { message });
      return;
    }
    
    next();
  };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime + 60000) { // Clean up 1 minute after reset
      rateLimitStore.delete(key);
    }
  }
}, 300000); // Every 5 minutes
