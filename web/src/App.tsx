import { NavLink, Route, Routes } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Todos from "./pages/Todos";
import Events from "./pages/Events";
import Budget from "./pages/Budget";
import History from "./pages/History";
import Documents from "./pages/Documents";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <div className="container">
      <nav>
        <ul>
          <li>
            <NavLink to="/" end>
              Dashboard
            </NavLink>
          </li>
          <li>
            <NavLink to="/todos">To-dos</NavLink>
          </li>
          <li>
            <NavLink to="/events">Events</NavLink>
          </li>
          <li>
            <NavLink to="/budget">Budget</NavLink>
          </li>
          <li>
            <NavLink to="/history">History</NavLink>
          </li>
          <li>
            <NavLink to="/documents">Documents</NavLink>
          </li>
          <li>
            <NavLink to="/profile">Profile</NavLink>
          </li>
        </ul>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/todos" element={<Todos />} />
        <Route path="/events" element={<Events />} />
        <Route path="/budget" element={<Budget />} />
        <Route path="/history" element={<History />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  );
}
