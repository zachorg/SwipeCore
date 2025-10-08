
import { sign, verify, SignOptions } from "jsonwebtoken";
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

// Utility: Clean up expired sessions
export function cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of sessions.entries()) {
        if (now > session.expiresAt) {
            sessions.delete(sessionId);
            console.log(`Cleaned up expired session: ${sessionId}`);
        }
    }
}

// Clean up expired sessions periodically
setInterval(() => {
    cleanupExpiredSessions();
}, 60000); // Check every minute

// Utility: sign tokens
export function signAccessToken(uid: string) {
    const options: SignOptions = { expiresIn: ACCESS_TTL as any };
    return sign(
        { sub: uid, typ: "access" },
        ACCESS_SECRET,
        options
    );
}

export function signRefreshToken(uid: string, sid: string) {
    const options: SignOptions = { expiresIn: REFRESH_TTL as any };
    return sign(
        { sub: uid, sid: sid, typ: "refresh" },
        REFRESH_SECRET,
        options
    );
}

export function requireAuth(req: any, res: any, next: any) {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) return res.sendStatus(401);

    try {
        const payload = verify(token, ACCESS_SECRET);
        const sessionId = payload.sub as string;

        // Check if session exists and is not expired
        const session = sessions.get(sessionId);
        if (!session || new Date() > session.expiresAt) {
            // Clean up expired session if it exists
            if (session) {
                sessions.delete(sessionId);
                console.log(`Removed expired session from auth middleware: ${sessionId}`);
            }
            return res.status(401).json({
                success: false,
                errorCode: "SESSION_EXPIRED",
                message: 'Session has expired',
            });
        }

        req.body.sid = sessionId;
        next();
    } catch {
        return res.sendStatus(401);
    }
}
