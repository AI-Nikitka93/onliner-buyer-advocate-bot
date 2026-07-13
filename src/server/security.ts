import type { NextFunction, Request, Response } from "express";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

function envNumber(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clientKey(req: Request): string {
  const forwarded = String(req.header("x-forwarded-for") || "").split(",")[0].trim();
  return forwarded || req.ip || req.socket.remoteAddress || "unknown";
}

export function getSecurityStatus() {
  const adminTokenConfigured = Boolean(process.env.ADMIN_API_TOKEN);
  const adminRequired = process.env.NODE_ENV === "production" || adminTokenConfigured;

  return {
    adminTokenConfigured,
    adminRequired,
    rateLimit: {
      windowMs: envNumber("RATE_LIMIT_WINDOW_MS", 60_000),
      maxRequests: envNumber("RATE_LIMIT_MAX_REQUESTS", 120),
    },
  };
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const configuredToken = process.env.ADMIN_API_TOKEN;
  const adminRequired = process.env.NODE_ENV === "production" || Boolean(configuredToken);

  if (!adminRequired) return next();

  if (!configuredToken) {
    return res.status(503).json({
      error: "ADMIN_API_TOKEN is required for admin endpoints in production.",
    });
  }

  const authHeader = String(req.header("authorization") || "");
  const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
    ? authHeader.slice("bearer ".length).trim()
    : "";
  const providedToken = bearerToken || String(req.header("x-admin-token") || "");

  if (providedToken !== configuredToken) {
    return res.status(401).json({ error: "Invalid admin token." });
  }

  next();
}

export function createRateLimiter() {
  const windowMs = envNumber("RATE_LIMIT_WINDOW_MS", 60_000);
  const maxRequests = envNumber("RATE_LIMIT_MAX_REQUESTS", 120);
  const hits = new Map<string, RateLimitEntry>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = `${clientKey(req)}:${req.method}:${req.path}`;
    const current = hits.get(key);
    const entry = current && current.resetAt > now
      ? current
      : { count: 0, resetAt: now + windowMs };

    entry.count += 1;
    hits.set(key, entry);

    if (hits.size > 10_000) {
      for (const [storedKey, storedEntry] of hits) {
        if (storedEntry.resetAt <= now) hits.delete(storedKey);
      }
    }

    const remaining = Math.max(0, maxRequests - entry.count);
    res.setHeader("X-RateLimit-Limit", String(maxRequests));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > maxRequests) {
      return res.status(429).json({
        error: "Too many requests.",
        retryAfterSeconds: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    next();
  };
}
