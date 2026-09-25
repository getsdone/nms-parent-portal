import { test } from "node:test";
import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import express from "express";
import { app, errorHandler } from "../src/app.js";

test("GET /api/health returns ok", async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/api/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { ok: true });
  } finally {
    server.close();
  }
});

test("async handler rejection reaches errorHandler as 500 JSON", async () => {
  // Separate throwaway app: `app` is shared across the test file, and this
  // test only needs to prove that errorHandler turns a rejected promise
  // into a 500 JSON response under Express 5's automatic forwarding.
  const throwawayApp = express();
  throwawayApp.get("/boom", async () => {
    throw new Error("boom");
  });
  throwawayApp.use(errorHandler);

  const server = throwawayApp.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/boom`);
    assert.equal(res.status, 500);
    assert.deepEqual(await res.json(), { error: "internal error" });
  } finally {
    server.close();
  }
});

test("errorHandler must be registered after every route that can throw", async () => {
  // Documents the ordering rule behind index.ts's repeated app.use(errorHandler):
  // Express only forwards an error to error middleware registered *after* the
  // handler that threw. Register errorHandler once, add a throwing route
  // after it, then register errorHandler again (mirroring app.ts + index.ts)
  // and confirm the second registration is what catches the error.
  const throwawayApp = express();
  throwawayApp.use(errorHandler);
  throwawayApp.get("/boom", async () => {
    throw new Error("boom");
  });
  throwawayApp.use(errorHandler);

  const server = throwawayApp.listen(0);
  try {
    const { port } = server.address() as AddressInfo;
    const res = await fetch(`http://127.0.0.1:${port}/boom`);
    assert.equal(res.status, 500);
    assert.equal(res.headers.get("content-type")?.includes("application/json"), true);
    assert.deepEqual(await res.json(), { error: "internal error" });
  } finally {
    server.close();
  }
});
