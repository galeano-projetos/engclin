/**
 * Rate Limiter in-memory simples para Server Actions e API Routes.
 * Usa sliding window por IP/key.
 */

const store = new Map<string, { count: number; resetAt: number }>();

// Limpar entradas expiradas a cada 60s
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key);
  }
}, 60_000);

interface RateLimitOptions {
  /** Identificador unico (ex: IP, userId, tenantId) */
  key: string;
  /** Numero maximo de requests na janela */
  limit: number;
  /** Janela em segundos */
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const storeKey = `${opts.key}`;

  const existing = store.get(storeKey);

  if (!existing || existing.resetAt < now) {
    store.set(storeKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: opts.limit - 1, resetAt: now + windowMs };
  }

  if (existing.count >= opts.limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count++;
  return { allowed: true, remaining: opts.limit - existing.count, resetAt: existing.resetAt };
}

/**
 * Extrai IP do request headers (funciona com Next.js API Routes)
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
