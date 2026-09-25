import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { app, errorHandler } from "./app.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webDist = path.resolve(__dirname, "../../web/dist");

// Static assets and SPA fallback live here, not in app.ts, so tests can
// import { app } and hit /api/health without web/dist existing on disk.
app.use(express.static(webDist));

app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile("index.html", { root: webDist });
});

// Express only forwards an error to error middleware registered after the
// handler that threw. app.ts already registers errorHandler, but that
// registration only covers the API routes defined there — it runs before
// the static and SPA fallback handlers added above, so an error from those
// (e.g. ENOENT when web/dist is missing) would otherwise skip it and fall
// through to Express's default HTML error page. Re-register it here, last.
app.use(errorHandler);

const port = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
