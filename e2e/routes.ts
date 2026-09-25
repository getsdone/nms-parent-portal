import type { Page } from "@playwright/test";

export const ROUTES = [
  { path: "/", h1: /^Hi, / },
  { path: "/todos", h1: "To-dos" },
  { path: "/events", h1: "Events" },
  { path: "/budget", h1: "Budget" },
  { path: "/history", h1: /^(.+’s journey|Program history)$/ },
  { path: "/documents", h1: "Documents" },
  { path: "/profile", h1: "Family info" },
] as const;

/** Collects console errors and uncaught page errors, ignoring a missing favicon. */
export function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    if (/favicon/i.test(msg.location().url) || /favicon/i.test(msg.text())) return;
    errors.push(`${msg.text()} @ ${msg.location().url}`);
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}
