import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const AdminLinks = [
  { to: "/admin/dashboard", label: "Dashboard", icon: "grid" },
  { to: "/admin/users", label: "Users", icon: "users" },
  { to: "/admin/alerts", label: "Alerts", icon: "bell" },
  { to: "/admin/insights", label: "Data Insights", icon: "chart" },
];

const SupervisorLinks = [
  { to: "/supervisor/dashboard", label: "Dashboard", icon: "grid" },
  { to: "/supervisor/violations", label: "Violations", icon: "shield" },
  { to: "/supervisor/reports", label: "Reports", icon: "file" },
];

const Icon = ({ name, className }) => {
  const paths = {
    grid: "M4 5h6v6H4V5zm10 0h6v6h-6V5zM4 15h6v6H4v-6zm10 0h6v6h-6v-6z",
    users:
      "M17 21v-2a4 4 0 00-3-3.87M7 21v-2a4 4 0 013-3.87M12 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.85M16 3.13a4 4 0 010 7.75M1 21v-2a4 4 0 013-3.85M8 3.13a4 4 0 000 7.75",
    bell: "M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
    chart: "M3 3v18h18M18.7 8l-5.1 5.1-3-3L3 17.5",
    shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
    file: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6",
    logout: "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={paths[name]} />
    </svg>
  );
};

const Layout = ({ children, title, subtitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = user?.role === "admin" ? AdminLinks : SupervisorLinks;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-white">
      <aside
        className={`fixed lg:static z-30 inset-y-0 left-0 w-64 bg-yellow-300 text-black-200 flex flex-col transform transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {" "}
        <nav className="flex-1 py-6 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5  text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-black text-white"
                    : "text-black-300 hover:bg-inkline hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-inkline">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-9 h-9 rounded-full bg-inkline flex items-center justify-center font-display text-sm">
              {user?.name?.charAt(0) || "?"}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-black-600 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-green hover:bg-inkline hover:text-white transition-colors"
          >
            Sign out {`==>`}
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-ink"
              onClick={() => setMobileOpen(true)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-6 h-6"
              >
                <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
              </svg>
            </button>
            <div>
              <h1 className="font-display font-semibold text-lg leading-tight">
                {title}
              </h1>
              {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
