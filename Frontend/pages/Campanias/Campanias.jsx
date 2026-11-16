import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader";
import {
  obtenerCampanias,
  crearCampania,
  actualizarCampania,
} from "../../services/campaniaService";
import { obtenerPersonal } from "../../services/personalService";
import CampaniaForm from "./CampaniaForm";
import CronogramaCampania from "./CronogramaCampania";
import "./Campanias.css";

// =====================================================
// FUNCIONES AUXILIARES
// =====================================================

function extraerLista(respuesta) {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.datos)) return respuesta.datos;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  return [];
}

// Convertir fecha sin problemas de zona horaria
const convertirFecha = (valor) => {
  if (!valor) return null;

  const texto = String(valor);

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [anio, mes, dia] = texto.split("-").map(Number);
    const fecha = new Date(anio, mes - 1, dia);

    if (
      fecha.getFullYear() !== anio ||
      fecha.getMonth() !== mes - 1 ||
      fecha.getDate() !== dia
    ) {
      return null;
    }

    return fecha;
  }

  const fecha = new Date(texto);

  return Number.isNaN(fecha.getTime()) ? null : fecha;
};

// Fecha utilizada para ordenar campañas
const obtenerFechaOrden = (campania) => {
  return (
    campania.created_at ||
    campania.fecha_creacion ||
    campania.fecha_inicio
  );
};

// Comprobar si pertenece al periodo seleccionado
const perteneceAlPeriodo = (campania, periodo) => {
  if (periodo === "todos") return true;

  const fechaCampania = convertirFecha(campania.fecha_inicio);

  if (!fechaCampania) return false;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const inicioMes = new Date(
    hoy.getFullYear(),
    hoy.getMonth(),
    1
  );

  const inicioAnio = new Date(
    hoy.getFullYear(),
    0,
    1
  );

  const hace30Dias = new Date(hoy);
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  const dentroDe30Dias = new Date(hoy);
  dentroDe30Dias.setDate(dentroDe30Dias.getDate() + 30);

  switch (periodo) {
    case "este_mes":
      return (
        fechaCampania >= inicioMes &&
        fechaCampania.getMonth() === hoy.getMonth() &&
        fechaCampania.getFullYear() === hoy.getFullYear()
      );

    case "ultimos_30_dias":
      return (
        fechaCampania >= hace30Dias &&
        fechaCampania <= hoy
      );

    case "proximos_30_dias":
      return (
        fechaCampania >= hoy &&
        fechaCampania <= dentroDe30Dias
      );

    case "este_anio":
      return (
        fechaCampania >= inicioAnio &&
        fechaCampania.getFullYear() === hoy.getFullYear()
      );

    default:
      return true;
  }
};

// Formatear fechas para las tarjetas
const formatearFechaCampania = (fecha) => {
  const fechaConvertida = convertirFecha(fecha);

  if (!fechaConvertida) return "Sin definir";

  return fechaConvertida.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Nombres de los estados
const nombresEstadosCampania = {
  planeada: "Planeada",
  activa: "Activa",
  finalizada: "Finalizada",
  cancelada: "Cancelada",
};

// Obtener responsable
function nombreResponsable(campania) {
  return campania.responsable_nombre || "Sin asignar";
}

// =====================================================
// TARJETA DE CAMPAÑA
// =====================================================

function CampaniaCard({
  campania,
  onEditar,
  onVerDetalles,
}) {
  const [imagenError, setImagenError] = useState(false);

  const estado = (
    campania.estado || "planeada"
  ).toLowerCase();

  const rutaImagen =
    campania.icono ||
    `/icons/campanias/${campania.codigo}.png`;

  return (
    <article className="campania-card campania-card-v2">

      {/* ICONO, NOMBRE Y CÓDIGO */}
      <div className="campania-card-top">

        {!imagenError ? (
          <img
            className="campania-card-avatar"
            src={rutaImagen}
            alt={`Icono de ${campania.nombre}`}
            onError={() => setImagenError(true)}
          />
        ) : (
          <div className="campania-card-avatar campania-image-fallback">
            <span className="material-symbols-rounded">
              {campania.categoria === "veterinaria"
                ? "pets"
                : "vaccines"}
            </span>
          </div>
        )}

        <div className="campania-card-identity">

          <h3 className="campania-card-name">
            {campania.nombre}
          </h3>

          <span className="campania-card-code">
            {campania.codigo}
          </span>
        </div>
      </div>

      {/* DESCRIPCIÓN */}
      <p className="campania-card-description">
        {campania.descripcion || "Sin descripción disponible."}
      </p>

      {/* INICIO, FIN Y ESTADO */}
      <div className="campania-card-timeline">

        <div className="campania-card-timeline-item">

          <div className="campania-card-timeline-heading">
            <span className="material-symbols-rounded">
              schedule
            </span>
            <span>Inicio</span>
          </div>

          <p className="campania-card-timeline-value">
            {formatearFechaCampania(campania.fecha_inicio)}
          </p>

        </div>

        <div className="campania-card-timeline-item">

          <div className="campania-card-timeline-heading">
            <span className="material-symbols-rounded">
              calendar_month
            </span>
            <span>Fin</span>
          </div>

          <p className="campania-card-timeline-value">
            {formatearFechaCampania(campania.fecha_fin)}
          </p>

        </div>

        <div className="campania-card-timeline-item">

          <div className="campania-card-timeline-heading">
            <span className="material-symbols-rounded">
              key
            </span>
            <span>Status</span>
          </div>

          <p className="campania-card-timeline-value">
            <span
              className={`campania-state campania-state--${estado}`}
            >
              {nombresEstadosCampania[estado] ||
                campania.estado ||
                "Sin estado"}
            </span>
          </p>
        </div>
      </div>

      {/* DOSIS Y RESPONSABLE */}
<div className="campania-card-extra">

  {/* DOSIS ASIGNADAS Y OBJETIVO */}
  <div className="campania-card-doses">

    {/* DOSIS ASIGNADAS */}
    <div className="campania-card-meta-line">
      <span className="material-symbols-rounded">
        vaccines
      </span>

      <div className="campania-card-meta-content">
        <span className="campania-card-meta-label">
          Dosis asignadas
        </span>

        <span className="campania-card-meta-value">
          {Number(
            campania.dosis_asignadas ?? 0
          ).toLocaleString("es-MX")}
        </span>
      </div>
    </div>

    {/* DOSIS OBJETIVO */}
      <div className="campania-card-meta-line">
        <span className="material-symbols-rounded">
          flag
        </span>

        <div className="campania-card-meta-content">
          <span className="campania-card-meta-label">
            Dosis objetivo
          </span>

          <span className="campania-card-meta-value">
            {Number(
              campania.objetivo_dosis ?? 0
            ).toLocaleString("es-MX")}
          </span>
        </div>
      </div>

    </div>

    {/* RESPONSABLE */}
    <div className="campania-card-meta-line">

      <span className="material-symbols-rounded">
        person
      </span>

      <div className="campania-card-meta-content">
        <span className="campania-card-meta-label">
          Responsable
        </span>

        <span className="campania-card-meta-value">
          {nombreResponsable(campania)}
        </span>
      </div>
    </div>
  </div>

      {/* BOTONES */}
      <div className="campania-card-actions">

        <button
          type="button"
          className="campania-button-details"
          onClick={() => onVerDetalles(campania)}
        >
          <span className="material-symbols-rounded">
            visibility
          </span>
          Ver detalles
        </button>

        <button
          type="button"
          className="campania-button-edit"
          onClick={() => onEditar(campania)}
        >
          <span className="material-symbols-rounded">
            edit
          </span>
          Editar campaña
        </button>
      </div>
    </article>
  );
}

// =====================================================
// SECCIÓN DE CAMPAÑAS
// =====================================================

function SeccionCampanias({
  titulo,
  descripcion,
  icono,
  campanias,
  onEditar,
  onVerDetalles,
  tipo,
}) {
  return (
    <section className="campanias-section">

      <div className="campanias-section-heading">

        <div className={`campanias-section-icon ${tipo}`}>
          <span className="material-symbols-rounded">
            {icono}
          </span>
        </div>

        <div>
          <h2>{titulo}</h2>
          <p>{descripcion}</p>
        </div>

        <span className="campanias-section-count">
          {campanias.length}{" "}
          {campanias.length === 1
            ? "campaña"
            : "campañas"}
        </span>

      </div>

      {campanias.length > 0 ? (

        <div className="campanias-grid">

          {campanias.map((campania) => (
            <CampaniaCard
              key={campania.id}
              campania={campania}
              onEditar={onEditar}
              onVerDetalles={onVerDetalles}
            />
          ))}

        </div>

      ) : (

        <div className="campanias-empty">
          <span className="material-symbols-rounded">
            {tipo === "veterinaria"
              ? "pets"
              : "vaccines"}
          </span>

          <h3>
            Aún no hay campañas en esta sección
          </h3>
          <p>
            Las campañas registradas aparecerán aquí.
          </p>
        </div>
      )}
    </section>
  );
}

export default function Campanias() {

  // =====================================================
  // ESTADOS PRINCIPALES
  // =====================================================

  const [campanias, setCampanias] = useState([]);
  const [responsables, setResponsables] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    if (!mensaje) return;
    const temporizador = setTimeout(() => {
      setMensaje("");
    }, 3000);
    return () => clearTimeout(temporizador);
  }, [mensaje]);

  // =====================================================
  // ESTADOS DE FILTROS
  // =====================================================

  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [filtroPeriodo, setFiltroPeriodo] = useState("todos");
  const [ordenamiento, setOrdenamiento] = useState("reciente");

  // =====================================================
  // ESTADOS DE MODALES
  // =====================================================

  const [modalAbierto, setModalAbierto] = useState(false);
  const [campaniaEditar, setCampaniaEditar] = useState(null);
  const [campaniaDetalle, setCampaniaDetalle] = useState(null);

  // =====================================================
  // CARGAR CAMPAÑAS Y RESPONSABLES
  // =====================================================

  const cargarDatos = useCallback(async () => {
    try {

      const [
        respuestaCampanias,
        respuestaPersonal,
      ] = await Promise.all([
        obtenerCampanias(),
        obtenerPersonal(),
      ]);

      setCampanias(
        extraerLista(respuestaCampanias)
      );

      const personal = extraerLista(respuestaPersonal);

      setResponsables(
        personal.filter(
          (persona) => Number(persona.rol_id) === 2
        )
      );

      setError("");

    } catch (error) {

      setError(
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        "No fue posible cargar la información de campañas."
      );

    } finally {
      setCargando(false);
    }
  }, []);

  // Carga inicial al montar el componente
  useEffect(() => {

    const temporizador = setTimeout(() => {
      void cargarDatos();
    }, 0);

    return () => clearTimeout(temporizador);

  }, [cargarDatos]);

  // =====================================================
  // FILTROS Y ORDENAMIENTO
  // =====================================================

  const campaniasFiltradas = useMemo(() => {

    let resultado = [...campanias];

    // Buscar por nombre o código
    if (busqueda.trim()) {

      const texto = busqueda.trim().toLowerCase();

      resultado = resultado.filter((campania) => {

        const nombre = String(
          campania.nombre || ""
        ).toLowerCase();

        const codigo = String(
          campania.codigo || ""
        ).toLowerCase();

        return (
          nombre.includes(texto) ||
          codigo.includes(texto)
        );
      });
    }

    // Filtrar por estado
    if (filtroEstado !== "todos") {
      resultado = resultado.filter(
        (campania) => campania.estado === filtroEstado
      );
    }

    // Filtrar por periodo
    resultado = resultado.filter((campania) =>
      perteneceAlPeriodo(campania, filtroPeriodo)
    );

    // Ordenar resultados
    resultado.sort((a, b) => {

      if (ordenamiento === "alfabetico") {

        return String(a.nombre || "").localeCompare(
          String(b.nombre || ""),
          "es",
          { sensitivity: "base" }
        );

      }

      const fechaA =
        convertirFecha(obtenerFechaOrden(a))?.getTime() ?? 0;

      const fechaB =
        convertirFecha(obtenerFechaOrden(b))?.getTime() ?? 0;

      if (ordenamiento === "antiguo") {
        return fechaA - fechaB;
      }
      return fechaB - fechaA;
    });
    return resultado;
  }, [
    campanias,
    busqueda,
    filtroEstado,
    filtroPeriodo,
    ordenamiento,
  ]);

  // =====================================================
  // SEPARAR CAMPAÑAS HUMANAS Y VETERINARIAS
  // =====================================================

  const campaniasHumanas = useMemo(
    () =>
      campaniasFiltradas.filter(
        (campania) => campania.categoria === "humana"
      ),
    [campaniasFiltradas]
  );

  const campaniasVeterinarias = useMemo(
    () =>
      campaniasFiltradas.filter(
        (campania) => campania.categoria === "veterinaria"
      ),
    [campaniasFiltradas]
  );

  // =====================================================
  // LIMPIAR FILTROS
  // =====================================================

  const limpiarFiltros = () => {

    setBusqueda("");
    setFiltroEstado("todos");
    setFiltroPeriodo("todos");
    setOrdenamiento("reciente");

  };

  // =====================================================
  // ESTADÍSTICAS GENERALES
  // =====================================================

  const estadisticas = useMemo(() => ({
  total: campanias.length,

  activas: campanias.filter(
    (c) => c.estado === "activa"
  ).length,

  planeadas: campanias.filter(
    (c) => c.estado === "planeada"
  ).length,

  finalizadas: campanias.filter(
    (c) => c.estado === "finalizada"
  ).length,

  canceladas: campanias.filter(
    (c) => c.estado === "cancelada"
  ).length,

}), [campanias]);

  // =====================================================
  // ABRIR MODALES
  // =====================================================

  const abrirNueva = () => {

    setCampaniaEditar(null);
    setCampaniaDetalle(null);
    setMensaje("");
    setError("");
    setModalAbierto(true);

  };

  const abrirEdicion = (campania) => {

    setCampaniaDetalle(null);
    setCampaniaEditar(campania);
    setMensaje("");
    setError("");
    setModalAbierto(true);

  };

  const abrirDetalles = (campania) => {
    setCampaniaDetalle(campania);
  };

  // =====================================================
  // GUARDAR CAMPAÑA
  // =====================================================

  const guardarCampania = async (datos) => {
  setGuardando(true);
  setError("");

  try {
    if (campaniaEditar) {
      await actualizarCampania(campaniaEditar.id, datos);

      setMensaje("La campaña se actualizó correctamente.");
    } else {
      await crearCampania(datos);

      setMensaje("La campaña se registró correctamente.");
    }

    setModalAbierto(false);
    setCampaniaEditar(null);

    await cargarDatos();

  } catch (error) {
      const mensajeError =
        error.response?.data?.mensaje ||
        error.response?.data?.message ||
        error.message ||
        "No fue posible guardar la campaña.";

      setError(mensajeError);

      // IMPORTANTE: devolver el error al formulario
      throw error;

    } finally {
      setGuardando(false);
    }
  };
 
  return (
    <main className="campanias-page">
      {/* ENCABEZADO */}
      <PageHeader
        titulo="Campañas"
        descripcion="Administra y organiza las campañas de vacunación."
        accion="Nueva campaña"
        onAccion={abrirNueva}
      />

      {/* MENSAJE DE ÉXITO */}
      {mensaje && (
        <div className="campanias-feedback success">
          <span className="material-symbols-rounded">
            check_circle
          </span>
          {mensaje}
        </div>
      )}

      {/* MENSAJE DE ERROR */}
      {error && (
        <div className="campanias-feedback error">
          <span className="material-symbols-rounded">
            error
          </span>
          {error}
          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Cerrar mensaje"
          >
            <span className="material-symbols-rounded">
              close
            </span>
          </button>
        </div>
      )}

      {/* ESTADÍSTICAS */}
      <section className="campanias-stats">

        {/* TOTAL */}
        <div className="campanias-stat-card">
          <div className="campanias-stat-icon total">
            <span className="material-symbols-rounded">
              campaign
            </span>
          </div>

          <div>
            <span>Total</span>
            <strong>{estadisticas.total}</strong>
          </div>
        </div>

        {/* ACTIVAS */}
        <div className="campanias-stat-card">
          <div className="campanias-stat-icon active">
            <span className="material-symbols-rounded">
              play_circle
            </span>
          </div>

          <div>
            <span>Activas</span>
            <strong>{estadisticas.activas}</strong>
          </div>
        </div>

        {/* PLANEADAS */}
        <div className="campanias-stat-card">
          <div className="campanias-stat-icon planned">
            <span className="material-symbols-rounded">
              event
            </span>
          </div>

          <div>
            <span>Planeadas</span>
            <strong>{estadisticas.planeadas}</strong>
          </div>
        </div>

        {/* FINALIZADAS */}
        <div className="campanias-stat-card">
          <div className="campanias-stat-icon finished">
            <span className="material-symbols-rounded">
              task_alt
            </span>
          </div>

          <div>
            <span>Finalizadas</span>
            <strong>{estadisticas.finalizadas}</strong>
          </div>
        </div>

        {/* CANCELADAS */}
        <div className="campanias-stat-card">
          <div className="campanias-stat-icon cancelled">
            <span className="material-symbols-rounded">
              cancel
            </span>
          </div>

          <div>
            <span>Canceladas</span>
            <strong>{estadisticas.canceladas}</strong>
          </div>
        </div>
      </section>

      {/* ================================================
          BÚSQUEDA Y FILTROS
      ================================================= */}

      <div className="campania-filters-panel">
        <div className="campania-filters-grid">

          {/* BUSCAR CAMPAÑA */}
          <div className="campania-filter-field campania-search-field">

            <label htmlFor="buscar-campania">
              Buscar campaña
            </label>

            <div className="campania-search-input">
              <span className="material-symbols-rounded">
                search
              </span>

              <input
                id="buscar-campania"
                type="text"
                placeholder="Nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>

          {/* ESTADO */}
          <div className="campania-filter-field">

            <label htmlFor="filtro-estado">
              Estado
            </label>

            <select
              id="filtro-estado"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todos">Todos los estados</option>
              <option value="activa">Activa</option>
              <option value="planeada">Planeada</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>

          {/* PERIODO */}
          <div className="campania-filter-field">

            <label htmlFor="filtro-periodo">
              Periodo
            </label>

            <select
              id="filtro-periodo"
              value={filtroPeriodo}
              onChange={(e) => setFiltroPeriodo(e.target.value)}
            >
              <option value="todos">Todos los periodos</option>
              <option value="este_mes">Este mes</option>
              <option value="ultimos_30_dias">
                Últimos 30 días
              </option>
              <option value="proximos_30_dias">
                Próximos 30 días
              </option>
              <option value="este_anio">Este año</option>
            </select>
          </div>

          {/* ORDENAR */}
          <div className="campania-filter-field">

            <label htmlFor="orden-campania">
              Ordenar por
            </label>

            <select
              id="orden-campania"
              value={ordenamiento}
              onChange={(e) => setOrdenamiento(e.target.value)}
            >
              <option value="reciente">Más reciente</option>
              <option value="antiguo">Menos reciente</option>
              <option value="alfabetico">
                Alfabéticamente (A-Z)
              </option>
            </select>
          </div>
        </div>

        {/* RESULTADOS Y LIMPIAR FILTROS */}
        <div className="campania-filters-footer">

          <span className="campania-filter-results">
            {campaniasFiltradas.length}{" "}
            {campaniasFiltradas.length === 1
              ? "campaña encontrada"
              : "campañas encontradas"}
          </span>

          <button
            type="button"
            className="campania-clear-filters"
            onClick={limpiarFiltros}
          >
            <span className="material-symbols-rounded">
              filter_alt_off
            </span>

            <span className="campania-clear-filters-text">
              Limpiar filtros
            </span>
          </button>
        </div>
      </div>

      {/* ================================================
          SECCIONES DE CAMPAÑAS
      ================================================= */}

      {cargando ? (
        <div className="campanias-loading">
          <span className="material-symbols-rounded">
            progress_activity
          </span>
          <p>Cargando campañas...</p>
        </div>
      ) : (
        <>
          {/* CAMPAÑAS HUMANAS */}
          <SeccionCampanias
            titulo="Campañas humanas"
            descripcion="Campañas de vacunación dirigidas a personas."
            icono="vaccines"
            tipo="humana"
            campanias={campaniasHumanas}
            onEditar={abrirEdicion}
            onVerDetalles={abrirDetalles}
          />

          {/* CAMPAÑAS VETERINARIAS */}
          <SeccionCampanias
            titulo="Campañas veterinarias"
            descripcion="Campañas de vacunación dirigidas a animales."
            icono="pets"
            tipo="veterinaria"
            campanias={campaniasVeterinarias}
            onEditar={abrirEdicion}
            onVerDetalles={abrirDetalles}
          />
        </>
      )}

      {/* ================================================
          MODAL DE DETALLES DE CAMPAÑA
      ================================================= */}

      {campaniaDetalle && (
        <div
          className="campania-details-overlay"
          onClick={() => setCampaniaDetalle(null)}
        >

        <div
          className="campania-details-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="campania-details-title"
          onClick={(e) => e.stopPropagation()}
        >

        {/* ENCABEZADO */}
          <div className="campania-details-header">
            <div>
              <span className="campania-details-eyebrow">
                DETALLES DE CAMPAÑA
              </span>

              <h2 id="campania-details-title">
                {campaniaDetalle.nombre}
              </h2>

              <span className="campania-card-code">
                 {campaniaDetalle.codigo}
              </span>
            </div>

              <button
                type="button"
                className="campania-details-close"
                onClick={() => setCampaniaDetalle(null)}
                aria-label="Cerrar detalles"
              >
                <span className="material-symbols-rounded">
                  close
                </span>
              </button>
            </div>

            {/* INFORMACIÓN DE LA CAMPAÑA */}
            <div className="campania-details-body">
              <div className="campania-details-item">

                <span className="campania-details-label">
                  Categoría
                </span>

                <span className="campania-details-value">
                  {campaniaDetalle.categoria === "humana"
                    ? "Humana"
                    : campaniaDetalle.categoria === "veterinaria"
                      ? "Veterinaria"
                      : "Sin categoría"}
                </span>
              </div>
              <div className="campania-details-item">

                <span className="campania-details-label">
                  Estado
                </span>

                <span
                  className={`campania-state campania-state--${(
                    campaniaDetalle.estado || "planeada"
                  ).toLowerCase()}`}
                >
                  {nombresEstadosCampania[
                    (campaniaDetalle.estado || "").toLowerCase()
                  ] ||
                    campaniaDetalle.estado ||
                    "Sin estado"}
                </span>
              </div>

              <div className="campania-details-item campania-details-item-full">
                <span className="campania-details-label">
                  Descripción
                </span>

                <p className="campania-details-value">
                  {campaniaDetalle.descripcion ||
                    "Sin descripción disponible."}
                </p>
              </div>

              <div className="campania-details-item">
                <span className="campania-details-label">
                  Fecha de inicio
                </span>

                <span className="campania-details-value">
                  {formatearFechaCampania(
                    campaniaDetalle.fecha_inicio
                  )}
                </span>
              </div>

              <div className="campania-details-item">
                <span className="campania-details-label">
                  Fecha de finalización
                </span>

                <span className="campania-details-value">
                  {formatearFechaCampania(
                    campaniaDetalle.fecha_fin
                  )}
                </span>
              </div>
              
              <div className="campania-details-item">
                <span className="campania-details-label">
                  Dosis asignadas
                </span>

                <span className="campania-details-value">
                  {Number(
                    campaniaDetalle.dosis_asignadas ?? 0
                  ).toLocaleString("es-MX")}
                </span>
              </div>

              <div className="campania-details-item">
                <span className="campania-details-label">
                  Dosis objetivo
                </span>

                <span className="campania-details-value">
                  {Number(
                    campaniaDetalle.objetivo_dosis ?? 0
                  ).toLocaleString("es-MX")}
                </span>
              </div>

              <div className="campania-details-item">
                <span className="campania-details-label">
                  Responsable
                </span>
                <span className="campania-details-value">
                  {nombreResponsable(campaniaDetalle)}
                </span>
              </div>
            </div>
            
            {/* CRONOGRAMA EXCLUSIVO DE LA CAMPAÑA 1 */}
            {Number(campaniaDetalle.id) === 6 && (
              <CronogramaCampania />
            )}

            {/* BOTONES DEL MODAL */}
            <div className="campania-details-actions">
              <button
                type="button"
                className="campania-button-edit"
                onClick={() => {}}
              >
                <span className="material-symbols-rounded">
                  event_note
                </span>
                Programar Actividades
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================
          MODAL DE CREACIÓN Y EDICIÓN
      ================================================= */}

      {modalAbierto && (
        <CampaniaForm
          key={campaniaEditar?.id ?? "nueva"}
          campania={campaniaEditar}
          responsables={responsables}
          guardando={guardando}
          onGuardar={guardarCampania}
          onCerrar={() => {
            if (!guardando) {
              setModalAbierto(false);
              setCampaniaEditar(null);
            }
          }}
        />
      )}
    </main>
  );
}