import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  marcarNotificacionLeida,
  obtenerNotificaciones,
  extraerDatosRespuesta,
} from "../../services/inventarioService";
import "./Header.css";

const fechaNotificacion = (valor) => {
  if (!valor) return "Fecha no disponible";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fecha);
};

const iconoNotificacion = (item = {}) => {
  if (item.severidad === "danger") return "report";
  if (item.severidad === "warning") return "warning";
  if (item.severidad === "success") return "task_alt";
  if (String(item.tipo || "").includes("recepcion")) return "move_to_inbox";
  if (String(item.tipo || "").includes("stock")) return "inventory_2";
  return "notifications_active";
};

function Header() {
  const navigate = useNavigate();
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [pendientes, setPendientes] = useState(0);
  const [cargandoNotificaciones, setCargandoNotificaciones] = useState(false);
  const [errorNotificaciones, setErrorNotificaciones] = useState(false);
  const [recarga, setRecarga] = useState(0);

  const cargarNotificaciones = useCallback(async () => {
    setCargandoNotificaciones(true);
    setErrorNotificaciones(false);
    try {
      const respuesta = await obtenerNotificaciones({ limit: 2 });
      const datos = extraerDatosRespuesta(respuesta) || {};
      const lista = Array.isArray(datos.notificaciones)
        ? datos.notificaciones
        : Array.isArray(datos)
          ? datos
          : [];

      setNotificaciones(lista.slice(0, 2));
      setPendientes(
        Number(
          datos.pendientes ??
          lista.filter((item) => !item.leida_at && !item.resuelta_at).length
        ) || 0
      );
    } catch (error) {
      console.warn("No fue posible cargar las notificaciones del header:", error);
      setErrorNotificaciones(true);
      setNotificaciones([]);
    } finally {
      setCargandoNotificaciones(false);
    }
  }, []);

  useEffect(() => {
    cargarNotificaciones();

    const actualizar = () => cargarNotificaciones();
    window.addEventListener("mgv:notifications-updated", actualizar);

    return () => {
      window.removeEventListener("mgv:notifications-updated", actualizar);
    };
  }, [cargarNotificaciones, recarga]);

  const abrirNotificaciones = () => {
    const siguiente = !notificacionesAbiertas;
    setNotificacionesAbiertas(siguiente);
    setPerfilAbierto(false);
    if (siguiente) setRecarga((valor) => valor + 1);
  };

  const abrirNotificacion = async (item) => {
    try {
      if (item?.id && !item.leida_at) {
        await marcarNotificacionLeida(item.id);
      }
    } catch (error) {
      console.warn("No se pudo marcar la notificación como leída:", error);
    } finally {
      setNotificacionesAbiertas(false);
      navigate("/notificaciones");
    }
  };

  const abrirPerfil = () => {
    setPerfilAbierto((actual) => !actual);
    setNotificacionesAbiertas(false);
  };

  return (
    <header className="top-header">
      <div className="top-header-brand">
        <span className="top-header-system">
          PLATAFORMA DE GESTIÓN DE VACUNACIÓN Y BRIGADAS - CHIAPAS
        </span>
      </div>

      <div className="top-header-actions">
        <button
          className="header-action"
          type="button"
          title="Imprimir página"
          aria-label="Imprimir página"
          onClick={() => window.print()}
        >
          <span className="material-symbols-rounded">print</span>
        </button>

        <div className="header-menu">
          <button
            className={`header-action notification-action ${notificacionesAbiertas ? "selected" : ""}`}
            type="button"
            title="Notificaciones"
            aria-label="Notificaciones"
            aria-expanded={notificacionesAbiertas}
            onClick={abrirNotificaciones}
          >
            <span className="material-symbols-rounded">notifications</span>
            {pendientes > 0 && (
              <span className="notification-count">
                {pendientes > 99 ? "99+" : pendientes}
              </span>
            )}
          </button>

          {notificacionesAbiertas && (
            <div className="header-popover notification-popover">
              <div className="popover-heading">
                <div>
                  <strong>Notificaciones</strong>
                  <small>
                    {pendientes > 0
                      ? `${pendientes} pendientes de lectura`
                      : "Centro de avisos"}
                  </small>
                </div>
                <span className="popover-live-dot" />
              </div>

              {cargandoNotificaciones ? (
                <div className="popover-loading">
                  <span className="header-mini-spinner" />
                  Consultando avisos…
                </div>
              ) : errorNotificaciones ? (
                <div className="popover-empty">
                  <span className="material-symbols-rounded">cloud_off</span>
                  <p>No se pudieron consultar los avisos.</p>
                  <button
                    type="button"
                    className="popover-retry"
                    onClick={() => setRecarga((valor) => valor + 1)}
                  >
                    Reintentar
                  </button>
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="popover-empty">
                  <span className="material-symbols-rounded">notifications_none</span>
                  <p>No hay notificaciones recientes.</p>
                </div>
              ) : (
                <div className="popover-notification-list">
                  {notificaciones.map((item) => (
                    <button
                      type="button"
                      className={`popover-notification severity-${item.severidad || "info"} ${!item.leida_at ? "unread" : ""}`}
                      key={item.id}
                      onClick={() => abrirNotificacion(item)}
                    >
                      <span className="popover-notification-icon material-symbols-rounded">
                        {iconoNotificacion(item)}
                      </span>
                      <span className="popover-notification-copy">
                        <strong>{item.titulo || "Notificación"}</strong>
                        <small>{item.mensaje || "Hay una actualización en el sistema."}</small>
                        <em>{fechaNotificacion(item.fecha_creacion)}</em>
                      </span>
                      {!item.leida_at && <i aria-label="No leída" />}
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="popover-see-all"
                onClick={() => {
                  setNotificacionesAbiertas(false);
                  navigate("/notificaciones");
                }}
              >
                Ver todas las notificaciones
                <span className="material-symbols-rounded">arrow_forward</span>
              </button>
            </div>
          )}
        </div>

        <div className="header-menu">
          <button
            className={`header-profile ${perfilAbierto ? "selected" : ""}`}
            type="button"
            aria-label="Abrir menú de perfil"
            aria-expanded={perfilAbierto}
            onClick={abrirPerfil}
          >
            <span className="material-symbols-rounded profile-avatar">account_circle</span>
            <span className="material-symbols-rounded profile-chevron">keyboard_arrow_down</span>
          </button>

          {perfilAbierto && (
            <div className="header-popover profile-popover">
              <div className="profile-popover-heading">
                <span className="material-symbols-rounded">account_circle</span>
                <div>
                  <strong>Mi cuenta</strong>
                  <small>MG-Vacuna</small>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPerfilAbierto(false);
                  navigate("/perfil");
                }}
              >
                <span className="material-symbols-rounded">person</span>
                Mi perfil
              </button>
              <button
                type="button"
                onClick={() => {
                  setPerfilAbierto(false);
                  navigate("/salir");
                }}
              >
                <span className="material-symbols-rounded">logout</span>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
