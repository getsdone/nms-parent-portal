import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { api } from "./api";
import type { DashboardData } from "./components/dashboard/types";
import { firstName, isCaregiver, useStar, withStar } from "./star";
import Dashboard from "./pages/Dashboard";
import Todos from "./pages/Todos";
import Events from "./pages/Events";
import Budget from "./pages/Budget";
import History from "./pages/History";
import Profile from "./pages/Profile";

function initial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

function StarSwitcher() {
  const { star, stars, setStar } = useStar();
  if (stars.length === 0) return null;
  return (
    <div className="star-switcher" role="group" aria-label="Choose a Star">
      {stars.map((s) => (
        <button
          key={s.id}
          type="button"
          className="star-pill"
          aria-pressed={s.id === star?.id}
          onClick={() => setStar(s.id)}
        >
          <span className="star-pill__initial" aria-hidden="true">
            {initial(s.first_name)}
          </span>
          {s.first_name}
        </button>
      ))}
    </div>
  );
}

/** Stands in for the account menu until the portal has sign-in. */
function ActingAs() {
  const { family, actingParent, setActingParent } = useStar();
  const parents = family?.parents ?? [];
  if (parents.length === 0 || !actingParent) return null;
  return (
    <label className="acting-as">
      <span className="acting-as__label">Acting as</span>
      <select
        className="acting-as__select"
        value={actingParent.id}
        onChange={(e) => setActingParent(Number(e.target.value))}
      >
        {parents.map((p) => (
          <option key={p.id} value={p.id}>
            {firstName(p.name)} · {p.role}
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Overdue required to-dos for the selected Star. Refetches on Star change
 * and on every route change, so completing a to-do updates the badge once
 * the parent moves to another page.
 */
function useOverdueCount(): number {
  const { star, ready } = useStar();
  const { pathname } = useLocation();
  const [count, setCount] = useState(0);
  const starId = star?.id;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    api<DashboardData>(withStar("/dashboard", starId))
      .then((d) => {
        if (!cancelled) setCount(d.overdue_todos.length);
      })
      // The badge and banner are nudges; the pages report their own load errors.
      .catch(() => {
        if (!cancelled) setCount(0);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, starId, pathname]);

  return count;
}

export default function App() {
  const { star, actingParent } = useStar();
  const { pathname } = useLocation();
  const caregiver = isCaregiver(actingParent);
  const overdue = useOverdueCount();
  const showBanner = overdue > 0 && pathname !== "/" && pathname !== "/todos";

  return (
    <>
      <header className="app-header">
        <div className="app-header__inner">
          <span className="brand">
            <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
              <polygon
                points="12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6"
                fill="oklch(0.84 0.15 85)"
                stroke="oklch(0.27 0.085 268)"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            National Math Stars
          </span>
          <nav className="nav">
            <ul className="nav__list">
              <li>
                <NavLink className="nav__link" to="/" end>
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink className="nav__link" to="/todos">
                  To-dos
                  {overdue > 0 && (
                    <span className="nav__count" aria-label={`${overdue} overdue`}>
                      {overdue}
                    </span>
                  )}
                </NavLink>
              </li>
              <li>
                <NavLink className="nav__link" to="/events">
                  Events
                </NavLink>
              </li>
              {!caregiver && (
                <li>
                  <NavLink className="nav__link" to="/budget">
                    Budget
                  </NavLink>
                </li>
              )}
              <li>
                <NavLink className="nav__link" to="/history">
                  History
                </NavLink>
              </li>
              <li>
                <NavLink className="nav__link" to="/profile">
                  Family info
                </NavLink>
              </li>
            </ul>
          </nav>
          <StarSwitcher />
          <ActingAs />
        </div>
      </header>
      {showBanner && (
        <div className="overdue-banner" role="status">
          <p className="overdue-banner__inner">
            {overdue} overdue {overdue === 1 ? "item" : "items"}
            {star ? ` for ${star.first_name}` : ""}.{" "}
            <Link className="overdue-banner__link" to="/todos">
              Finish now
            </Link>
          </p>
        </div>
      )}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/todos" element={<Todos />} />
          <Route path="/events" element={<Events />} />
          <Route path="/budget" element={<Budget />} />
          <Route path="/history" element={<History />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
    </>
  );
}
