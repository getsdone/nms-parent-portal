import express from "express";
import familyRouter from "./routes/family.js";
import todosRouter from "./routes/todos.js";
import historyRouter from "./routes/history.js";
import budgetRouter from "./routes/budget.js";
import eventsRouter from "./routes/events.js";
import dashboardRouter from "./routes/dashboard.js";

// Every feature router is registered here so later workers only ever edit
// their own server/src/routes/<name>.ts file, never this one.
export const app = express();

app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/family", familyRouter);
app.use("/api/todos", todosRouter);
app.use("/api/history", historyRouter);
app.use("/api/budget", budgetRouter);
app.use("/api/events", eventsRouter);
app.use("/api/dashboard", dashboardRouter);
