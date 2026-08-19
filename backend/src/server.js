import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import { proxyRouter } from "./routes/proxy.js";
import { statsRouter } from "./routes/stats.js";
import { adminAuthRouter } from "./routes/adminAuth.js";
import { apiKeysRouter } from "./routes/apiKeys.js";
import { routingRulesRouter } from "./routes/routingRules.js";
import { logsRouter } from "./routes/logs.js";
import { modelsAdminRouter } from "./routes/admin/models.js";

import { requireAdminAuth } from "./middleware/requireAdminAuth.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cookieParser());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Public / API gateway routes
app.use(proxyRouter);

// Admin authentication
app.use(adminAuthRouter);

// Admin/API routes
app.use(apiKeysRouter);
app.use(routingRulesRouter);
app.use(logsRouter);
app.use(modelsAdminRouter);

// Statistics
app.use("/v1/stats", requireAdminAuth);
app.use(statsRouter);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`llm-gateway listening on port ${PORT}`);
});