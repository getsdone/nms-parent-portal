import { Router } from "express";

// Stub: replaced by the worker implementing this feature. Do not add
// route-specific logic to server/src/app.ts to register this file; it is
// already mounted there.
const router = Router();

router.use((_req, res) => {
  res.status(501).json({ error: "not implemented" });
});

export default router;
