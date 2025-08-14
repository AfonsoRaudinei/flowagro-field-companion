// Token Bucket Rate Limiter for API calls
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per minute
  private readonly burstCapacity: number;

  constructor(rpm: number, burst: number) {
    this.capacity = rpm;
    this.refillRate = rpm / 60; // tokens per second
    this.burstCapacity = burst;
    this.tokens = Math.min(burst, rpm);
    this.lastRefill = Date.now();
  }

  consume(tokensRequested: number = 1): boolean {
    this.refill();
    
    if (this.tokens >= tokensRequested) {
      this.tokens -= tokensRequested;
      return true;
    }
    
    return false;
  }

  private refill(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = timePassed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  getAvailableTokens(): number {
    this.refill();
    return Math.floor(this.tokens);
  }
}

// Global rate limiters for each API
const rateLimiters = new Map<string, TokenBucket>();

export function getRateLimiter(apiName: string, rpm: number, burst: number): TokenBucket {
  if (!rateLimiters.has(apiName)) {
    rateLimiters.set(apiName, new TokenBucket(rpm, burst));
  }
  return rateLimiters.get(apiName)!;
}