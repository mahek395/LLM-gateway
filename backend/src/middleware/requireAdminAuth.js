import { verifyToken } from "../utils/jwt.js";

export function requireAdminAuth(req, res, next) {
  const token = req.cookies?.access_token;
  if (!token) return res.status(401).json({ error: "not_authenticated" });

  try {
    const payload = verifyToken(token);
    if (payload.type !== "access") throw new Error("wrong_token_type");
    req.admin = { id: payload.sub, email: payload.email };
    next();
  } catch {
    return res.status(401).json({ error: "token_expired" });
  }
}