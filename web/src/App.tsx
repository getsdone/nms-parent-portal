import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Todos from "./pages/Todos";
import Events from "./pages/Events";
import Budget from "./pages/Budget";
import History from "./pages/History";
import Profile from "./pages/Profile";

export default function App() {
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
                </NavLink>
              </li>
              <li>
                <NavLink className="nav__link" to="/events">
                  Events
                </NavLink>
              </li>
              <li>
                <NavLink className="nav__link" to="/budget">
                  Budget
                </NavLink>
              </li>
              <li>
                <NavLink className="nav__link" to="/history">
                  History
                </NavLink>
              </li>
              <li>
                <NavLink className="nav__link" to="/profile">
                  Profile
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
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
