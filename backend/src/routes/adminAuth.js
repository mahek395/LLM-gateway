import express from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { pool } from "../db/pool.js";
import { signAccessToken, signRefreshToken, verifyToken, COOKIE_OPTIONS } from "../utils/jwt.js";

export const adminAuthRouter = express.Router();

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

adminAuthRouter.post("/admin/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  const result = await pool.query("SELECT * FROM admins WHERE email = $1", [email]);
  const admin = result.rows[0];
  if (!admin) return res.status(401).json({ error: "invalid_credentials" });

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return res.status(401).json({ error: "invalid_credentials" });

  const accessToken = signAccessToken(admin);
  const refreshToken = signRefreshToken(admin);

  await pool.query("UPDATE admins SET refresh_token_hash = $1 WHERE id = $2", [hashToken(refreshToken), admin.id]);

  res
    .cookie("access_token", accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 })
    .cookie("refresh_token", refreshToken, { ...COOKIE_OPTIONS, maxAge: 7 * 24 * 60 * 60 * 1000 })
    .json({ email: admin.email });
});

adminAuthRouter.post("/admin/refresh", async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) return res.status(401).json({ error: "no_refresh_token" });

  let payload;
  try {
    payload = verifyToken(refreshToken);
  } catch {
    return res.status(401).json({ error: "invalid_refresh_token" });
  }
  if (payload.type !== "refresh") return res.status(401).json({ error: "invalid_token_type" });

  const result = await pool.query("SELECT * FROM admins WHERE id = $1", [payload.sub]);
  const admin = result.rows[0];

  if (!admin || admin.refresh_token_hash !== hashToken(refreshToken)) {
    return res.status(401).json({ error: "refresh_token_revoked" });
  }

  const newAccessToken = signAccessToken(admin);
  res.cookie("access_token", newAccessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 }).json({ email: admin.email });
});

adminAuthRouter.post("/admin/logout", async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (refreshToken) {
    try {
      const payload = verifyToken(refreshToken);
      await pool.query("UPDATE admins SET refresh_token_hash = NULL WHERE id = $1", [payload.sub]);
    } catch {}
  }
  res.clearCookie("access_token", COOKIE_OPTIONS).clearCookie("refresh_token", COOKIE_OPTIONS).json({ ok: true });
});