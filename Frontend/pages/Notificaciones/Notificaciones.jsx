import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import {
  obtenerNotificaciones,
  marcarNotificacionLeida,
  resolverNotificacion,
  extraerDatosRespuesta,
  obtenerMensajeErrorInventario,
} from "../../services/inventarioService";
import { fechaRelativa } from "../Inventario/inventarioUtils";
import "./Notificaciones.css";

const comoArray = (valor) => (Array.isArray(valor) ? valor : []);

const iconoNotificacion = (item = {}) => {
  if (item.severidad === "danger") return "report";
  if (item.severidad === "warning") return "warning";
  if (item.severidad === "success") return "task_alt";
  if (String(item.tipo || "").includes("recepcion")) return "move_to_inbox";
  if (String(item.tipo || "").includes("stock")) return "inventory_2";
  return "notifications_active";
};

const etiquetaCategoria = (categoria) =>
  ({
    biologicos: "Biológicos",
    insumos: "Insumos",
    campanias: "Campañas",
    brigadas: "Brigadas",
    visitas: "Visitas",
    general: "General",
  })[categoria] || categoria || "General";

const etiquetaSeveridad = (severidad) =>
  ({
    danger: "Atención inmediata",
    warning: "Requiere atención",
    success: "Correcto",
    info: "Informativa",
  })[severidad] || "Notificación";

export default function Notificaciones() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [pendientes, setPendientes] = useState(0);
  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroEstado, setFiltroEstado] = useState("activas");
  const [cargando, setCargando] = useState(true);
  const [actualizandoId, setActualizandoId] = useState(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [recarga, setRecarga] = useState(0);

  // La carga depende solo del filtro y del botón actualizar. El efecto cancela
  // las actualizaciones de estado si el usuario abandona la página.
  useEffect(() => {
    let vigente = true;

    const cargar = async () => {
      setCargando(true);
      setError("");
      try {
        const params = filtroEstado === "pendientes"
          ? { solo_pendientes: true, limit: 250 }
          : { limit: 250 };
        const respuesta = await obtenerNotificaciones(params);
        const datos = extraerDatosRespuesta(respuesta) || {};
        if (!vigente) return;
        setItems(
          comoArray(Array.isArray(datos) ? datos : datos.notificaciones)
        );
        setPendientes(Number(datos.pendientes || 0));
      } catch (err) {
        if (vigente) {
          setError(
            obtenerMensajeErrorInventario(
              err,
              "No fue posible cargar las notificaciones. Verifica que el backend esté activo."
            )
          );
          setItems([]);
        }
      } finally {
        if (vigente) setCargando(false);
      }
    };

    cargar();
    return () => {
      vigente = false;
    };
  }, [filtroEstado, recarga]);

  const filtradas = useMemo(() => {
    return items.filter((item) => {
      const coincideCategoria =
        filtroCategoria === "todas" || item.categoria === filtroCategoria;
      const coincideEstado =
        filtroEstado === "historico"
          ? Boolean(item.resuelta_at)
          : filtroEstado === "leidas"
            ? Boolean(item.leida_at) && !item.resuelta_at
            : filtroEstado === "activas"
              ? !item.resuelta_at
              : filtroEstado === "pendientes"
                ? !item.leida_at && !item.resuelta_at
                : true;
      return coincideCategoria && coincideEstado;
    });
  }, [items, filtroCategoria, filtroEstado]);

  const marcarLeida = async (item) => {
    if (!item?.id || item.leida_at) return true;
    try {
      setActualizandoId(item.id);
      await marcarNotificacionLeida(item.id);
      setItems((actuales) =>
        actuales.map((x) =>
          String(x.id) === String(item.id)
            ? { ...x, leida_at: new Date().toISOString() }
            : x
        )
      );
      setPendientes((n) => Math.max(n - 1, 0));
      window.dispatchEvent(new Event("mgv:notifications-updated"));
      return true;
    } catch (err) {
      setError(obtenerMensajeErrorInventario(err));
      return false;
    } finally {
      setActualizandoId(null);
    }
  };

  const resolver = async (item) => {
    if (!item?.id) return;
    try {
      setActualizandoId(item.id);
      await resolverNotificacion(item.id);
      const ahora = new Date().toISOString();
      setItems((actuales) =>
        actuales.map((x) =>
          String(x.id) === String(item.id)
            ? { ...x, leida_at: x.leida_at || ahora, resuelta_at: ahora }
            : x
        )
      );
      if (!item.leida_at) setPendientes((n) => Math.max(n - 1, 0));
      setMensaje("La notificación se marcó como resuelta.");
      window.dispatchEvent(new Event("mgv:notifications-updated"));
    } catch (err) {
      setError(obtenerMensajeErrorInventario(err));
    } finally {
      setActualizandoId(null);
    }
  };

  const verReferencia = async (item) => {
    const correcto = await marcarLeida(item);
    if (correcto) navigate("/inventario");
  };

  const contadores = useMemo(
    () => ({
      danger: items.filter((x) => x.severidad === "danger" && !x.resuelta_at).length,
      warning: items.filter((x) => x.severidad === "warning" && !x.resuelta_at).length,
      success: items.filter((x) => x.severidad === "success").length,
    }),
    [items]
  );

  return (
    <main className="notifications-page">
      <PageHeader
        titulo="Centro de notificaciones"
        descripcion="Avisos de inventario, conciliaciones y movimientos importantes de MG-Vacuna."
      />

      {error && (
        <div className="notif-feedback error">
          <span className="material-symbols-rounded">error</span>
          {error}
          <button type="button" onClick={() => setError("")} aria-label="Cerrar error">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
      )}
      {mensaje && (
        <div className="notif-feedback success">
          <span className="material-symbols-rounded">check_circle</span>
          {mensaje}
          <button type="button" onClick={() => setMensaje("")} aria-label="Cerrar mensaje">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>
      )}

      <section className="notif-overview">
        <div className="notif-overview-copy">
          <span className="notif-eyebrow">SEGUIMIENTO DEL SISTEMA</span>
          <h2>Las señales importantes, en un solo lugar.</h2>
          <p>Consulta los avisos recientes y da seguimiento a las incidencias que requieren atención.</p>
        </div>
        <div className="notif-overview-stats">
          <div className="notif-stat red"><span className="material-symbols-rounded">report</span><div><strong>{contadores.danger}</strong><small>Críticas</small></div></div>
          <div className="notif-stat amber"><span className="material-symbols-rounded">warning</span><div><strong>{contadores.warning}</strong><small>Preventivas</small></div></div>
          <div className="notif-stat green"><span className="material-symbols-rounded">task_alt</span><div><strong>{contadores.success}</strong><small>Correctas</small></div></div>
        </div>
      </section>

      <section className="notif-workspace">
        <div className="notif-toolbar">
          <div className="notif-toolbar-title">
            <span className="notif-eyebrow">BANDEJA DE AVISOS</span>
            <h2>Todas las notificaciones <span>{filtradas.length}</span></h2>
          </div>
          <button
            type="button"
            className="notif-refresh"
            onClick={() => setRecarga((actual) => actual + 1)}
            disabled={cargando}
          >
            <span className={`material-symbols-rounded ${cargando ? "notif-spin" : ""}`}>refresh</span>
            Actualizar
          </button>
        </div>

        <div className="notif-filters">
          <div className="notif-filter-group" role="group" aria-label="Filtrar por estado">
            {[
              ["activas", "Activas"],
              ["pendientes", "Sin leer"],
              ["leidas", "Leídas"],
              ["historico", "Resueltas"],
            ].map(([valor, etiqueta]) => (
              <button
                type="button"
                key={valor}
                className={filtroEstado === valor ? "active" : ""}
                onClick={() => setFiltroEstado(valor)}
              >
                {etiqueta}
                {valor === "pendientes" && <span>{pendientes}</span>}
              </button>
            ))}
          </div>
          <div className="notif-category-select">
            <span className="material-symbols-rounded">filter_list</span>
            <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
              <option value="todas">Todas las categorías</option>
              <option value="biologicos">Biológicos</option>
              <option value="insumos">Insumos</option>
              <option value="campanias">Campañas</option>
              <option value="brigadas">Brigadas</option>
              <option value="visitas">Visitas</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        {cargando ? (
          <div className="notif-loading"><span className="notif-spinner"/><strong>Consultando avisos…</strong></div>
        ) : filtradas.length === 0 ? (
          <div className="notif-empty">
            <span className="material-symbols-rounded">notifications_none</span>
            <strong>No hay notificaciones en esta sección</strong>
            <span>Cuando se registre un movimiento o se detecte alguna situación, aparecerá aquí.</span>
          </div>
        ) : (
          <div className="notif-list">
            {filtradas.map((item) => (
              <article
                key={item.id}
                className={`notif-card severity-${item.severidad || "info"} ${!item.leida_at ? "unread" : ""} ${item.resuelta_at ? "resolved" : ""}`}
              >
                <div className="notif-card-icon"><span className="material-symbols-rounded">{iconoNotificacion(item)}</span></div>
                <div className="notif-card-main">
                  <div className="notif-card-meta">
                    <span className={`notif-severity-pill ${item.severidad || "info"}`}>{etiquetaSeveridad(item.severidad)}</span>
                    <span className="notif-category-pill">{etiquetaCategoria(item.categoria)}</span>
                    {!item.leida_at && <span className="notif-unread-dot">Nueva</span>}
                    {item.resuelta_at && <span className="notif-resolved-pill">Resuelta</span>}
                  </div>
                  <h3>{item.titulo || "Notificación"}</h3>
                  <p>{item.mensaje || "Hay una actualización en el sistema."}</p>
                  <div className="notif-card-foot">
                    <span><span className="material-symbols-rounded">schedule</span>{fechaRelativa(item.fecha_creacion)}</span>
                    {item.campania_codigo && <span><span className="material-symbols-rounded">campaign</span>{item.campania_codigo}</span>}
                    {item.visita_codigo && <span><span className="material-symbols-rounded">event_note</span>{item.visita_codigo}</span>}
                    {item.insumo_nombre && <span><span className="material-symbols-rounded">inventory_2</span>{item.insumo_nombre}</span>}
                  </div>
                </div>
                <div className="notif-card-actions">
                  {!item.leida_at && (
                    <button type="button" className="notif-action secondary" onClick={() => marcarLeida(item)} disabled={actualizandoId === item.id}>Marcar leída</button>
                  )}
                  {!item.resuelta_at && item.severidad !== "success" && (
                    <button type="button" className="notif-action resolve" onClick={() => resolver(item)} disabled={actualizandoId === item.id}>
                      <span className="material-symbols-rounded">done</span>Resolver
                    </button>
                  )}
                  <button type="button" className="notif-action view" onClick={() => verReferencia(item)} disabled={actualizandoId === item.id}>
                    Ver módulo<span className="material-symbols-rounded">arrow_outward</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="notif-footer-note">
        <span className="material-symbols-rounded">history</span>
        Las notificaciones resueltas permanecen en el historial. Los avisos automáticos se actualizan cuando la situación que los originó cambia.
      </div>
    </main>
  );
}
