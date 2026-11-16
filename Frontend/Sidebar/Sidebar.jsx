import { useState, useEffect, useRef } from "react";
import "./Sidebar.css";
import { NavLink } from "react-router-dom";

const primaryItems = [
  { icon: "campaign", label: "Campañas", path: "/campanas" },
  { icon: "location_on", label: "Localidades", path: "/localidades" },
  { icon: "badge", label: "Personal", path: "/personal" },
  { icon: "local_shipping", label: "Transporte", path: "/transporte" },
  { icon: "groups", label: "Brigadas", path: "/brigadas" },
  { icon: "clinical_notes", label: "Visitas", path: "/visitas" },
  { icon: "route", label: "Rutas", path: "/rutas" },
  { icon: "inventory_2", label: "Inventario", path: "/inventario" },
  { icon: "assessment", label: "Reportes", path: "/reportes" },
];

const secondaryItems = [
  { icon: "account_circle", label: "Perfil", path: "/perfil" },
  { icon: "logout", label: "Cerrar sesión", path: "/salir" },
];

function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const sidebarRef = useRef(null);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  const closeSidebar = () => {
    setCollapsed(true);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target)
      ) {
        closeSidebar();
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeSidebar();
      }
    };

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const renderItems = (items) =>
  items.map((item) => (
    <li className="nav-item" key={item.label}>
      <NavLink
        to={item.path}
        className={({ isActive }) =>
          `nav-link ${isActive ? "active" : ""}`
        }
        onClick={closeSidebar}
      >
        <span className="nav-icon material-symbols-rounded">
          {item.icon}
        </span>

        <span className="nav-label">{item.label}</span>
      </NavLink>

      <span className="nav-tooltip">{item.label}</span>
    </li>
  ));

  return (
    <aside
      ref={sidebarRef}
      className={`sidebar ${collapsed ? "collapsed" : ""}`}
    >
      <header className="sidebar-header">
        <NavLink to="/" className="header-logo" title="Ir al inicio">
          <img src="/img/logo.png" alt="MG-Vacuna" />
        </NavLink>

        <span className="brand-title">
          <span className="brand-mg">MG</span>
          <span className="brand-divider">-</span>
          <span className="brand-vacuna">Vacuna</span>
        </span>

        <button
          className="toggler sidebar-toggler"
          aria-label="Abrir o cerrar menú"
          aria-expanded={!collapsed}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggleSidebar();
          }}
        >
          <span className="material-symbols-rounded">
            chevron_left
          </span>
        </button>
      </header>

      <nav className="sidebar-nav" aria-label="Menú principal">
        <ul className="nav-list primary-nav">
          {renderItems(primaryItems)}
        </ul>

        <ul className="nav-list secondary-nav">
          {renderItems(secondaryItems)}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;