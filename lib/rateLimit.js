// lib/rateLimit.js
const rateLimit = new Map();

export function checkRateLimit(identifier, maxRequests = 10, windowMs = 60000) {
  const now = Date.now();
  const userRequests = rateLimit.get(identifier) || [];
  
  // Remove old requests outside window
  const validRequests = userRequests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  validRequests.push(now);
  rateLimit.set(identifier, validRequests);
  
  return { 
    allowed: true, 
    remaining: maxRequests - validRequests.length 
  };
}