import express from "express";

import { requireAdminAuth } from "../middleware/requireAdminAuth.js";
import {
  getRoutingRules,
  updateRoutingRules,
} from "../services/routingRulesStore.js";

export const routingRulesRouter = express.Router();

routingRulesRouter.use(requireAdminAuth);

routingRulesRouter.get(
  "/admin/routing-rules",
  async (req, res) => {
    try {
      const rules = await getRoutingRules();
      res.json(rules);
    } catch (err) {
      console.error("get routing rules failed:", err);

      res.status(500).json({
        error: "routing_rules_fetch_failed",
        detail: err.message,
      });
    }
  }
);

routingRulesRouter.put(
  "/admin/routing-rules",
  async (req, res) => {
    try {
      const updated = await updateRoutingRules(
        req.body
      );

      res.json(updated);
    } catch (err) {
      console.error("update routing rules failed:", err);

      res.status(400).json({
        error: "routing_rules_update_failed",
        detail: err.message,
      });
    }
  }
);