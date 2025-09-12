
import { sign, verify } from "jsonwebtoken";
import { config as envConfig } from "../config";

// ----- ENV -----
const ACCESS_TTL = `${envConfig.authAccessTtlSeconds}s`; // short lived
const REFRESH_TTL = `${envConfig.authRefreshTtlSeconds}s`;

export const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "dev-access-secret";
export const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "dev-refresh-secret";

export interface SessionData {
    sid: string;
    uid: string;
    refreshHash: string;
    expiresAt: Date;
}

/** sessions: sessionId -> { id, userId, refreshHash, expiresAt } */
export const sessions = new Map<string, SessionData>();

// Utility: sign tokens
export function signAccessToken(uid: string) {
    return sign(
        { sub: uid, typ: "access" },
        ACCESS_SECRET,
        { expiresIn: ACCESS_TTL }
    );
}

export function signRefreshToken(uid: string, sid: string) {
    return sign(
        { sub: uid, sid: sid, typ: "refresh" },
        REFRESH_SECRET,
        { expiresIn: REFRESH_TTL }
    );
}

export function requireAuth(req: any, res: any, next: any) {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return res.sendStatus(401);

    try {
        const payload = verify(token, ACCESS_SECRET);
        req.body.sid = payload.sub;
        next();
    } catch {
        return res.sendStatus(401);
    }
}
