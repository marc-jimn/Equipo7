import { useEffect } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Login from "./pages/Login/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import AppErrorBoundary from "./components/AppErrorBoundary";
import LogoutTransition from "./components/LogoutTransition";

import { cerrarSesion } from "./services/authService";

import Inicio from "./pages/Inicio/Inicio";
import Personal from "./pages/Personal/Personal";
import Campanias from "./pages/Campanias/Campanias";
import Localidades from "./pages/Localidades/Localidades";
import Transporte from "./pages/Transporte/Transporte";
import Brigadas from "./pages/Brigadas/Brigadas";
import Visitas from "./pages/Visitas/Visitas";
import RutasRecorridos from "./pages/RutasRecorridos/RutasRecorridos";
import Inventario from "./pages/Inventario/Inventario";
import Reportes from "./pages/Reportes/Reportes";
import Notificaciones from "./pages/Notificaciones/Notificaciones";


/* =========================================
   TÍTULO DINÁMICO DEL NAVEGADOR
========================================= */

function TituloDinamico() {
  const location = useLocation();

  useEffect(() => {
    const rutas = {
      "/": "Dashboard",
      "/inicio": "Dashboard",
      "/login": "Iniciar sesión",
      "/salir": "Cerrando sesión",
      "/cambiar-password": "Cambiar contraseña",
      "/personal": "Personal",
      "/campanas": "Campañas",
      "/localidades": "Localidades",
      "/brigadas": "Brigadas",
      "/transporte": "Transporte",
      "/rutas": "Rutas",
      "/visitas": "Visitas",
      "/inventario": "Inventario",
      "/notificaciones": "Notificaciones",
      "/reportes": "Reportes",
      "/perfil": "Mi perfil",
    };

    const modulo = rutas[location.pathname] || "MG-Vacuna";

    document.title =
      modulo === "MG-Vacuna"
        ? "MG-Vacuna"
        : `MG-Vacuna | ${modulo}`;

  }, [location.pathname]);

  return null;
}


/* =========================================
   MÓDULOS PENDIENTES
========================================= */

function ModuloPendiente({ nombre }) {
  return (
    <section className="pending-module">

      <div className="pending-module-icon">
        <span className="material-symbols-rounded">
          construction
        </span>
      </div>

      <h1>{nombre}</h1>

      <p>
        Este módulo formará parte de MG-Vacuna.
        Estamos preparando sus herramientas y funcionalidades.
      </p>

    </section>
  );
}


/* =========================================
   PANTALLA DE CIERRE DE SESIÓN
========================================= */

function PantallaCerrarSesion() {
  const navigate = useNavigate();

  useEffect(() => {

    // Eliminar token y datos del usuario
    cerrarSesion();

  }, []);

  return (
    <LogoutTransition
      onComplete={() => {
        navigate("/login", { replace: true });
      }}
    />
  );
}


/* =========================================
   APLICACIÓN PRINCIPAL
========================================= */

function App() {

  return (
    <>

      <TituloDinamico />

      <Routes>

        {/* =================================
            ACCESO PÚBLICO
        ================================= */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* =================================
            CAMBIO DE CONTRASEÑA
        ================================= */}

        <Route
          path="/cambiar-password"
          element={
            <ModuloPendiente nombre="Cambiar contraseña" />
          }
        />


        {/* =================================
            CIERRE DE SESIÓN
        ================================= */}

        <Route
          path="/salir"
          element={<PantallaCerrarSesion />}
        />


        {/* =================================
            MÓDULOS PROTEGIDOS
        ================================= */}

        <Route element={<ProtectedRoute />}>

          <Route element={<MainLayout />}>

            {/* INICIO */}
            <Route
              path="/"
              element={<Inicio />}
            />

            <Route
              path="/inicio"
              element={<Inicio />}
            />

            {/* CAMPAÑAS */}
            <Route
              path="/campanas"
              element={<Campanias />}
            />

            {/* LOCALIDADES */}
            <Route
              path="/localidades"
              element={<Localidades />}
            />

            {/* BRIGADAS */}
            <Route
              path="/brigadas"
              element={<Brigadas />}
            />

            {/* PERSONAL */}
            <Route
              path="/personal"
              element={<Personal />}
            />

            {/* TRANSPORTE */}
            <Route
              path="/transporte"
              element={<Transporte />}
            />

            {/* VISITAS */}
            <Route
              path="/visitas"
              element={<Visitas />}
            />

            {/* RUTAS */}
            <Route
              path="/rutas"
              element={<RutasRecorridos />}
            />

            {/* INVENTARIO */}
            <Route
              path="/inventario"
              element={<Inventario />}
            />

            {/* NOTIFICACIONES */}
            <Route
              path="/notificaciones"
              element={<Notificaciones />}
            />

            {/* REPORTES */}
            <Route
              path="/reportes"
              element={<Reportes />}
            />

            {/* PERFIL */}
            <Route
              path="/perfil"
              element={
                <ModuloPendiente nombre="Mi perfil" />
              }
            />

          </Route>

        </Route>


        {/* =================================
            RUTA NO ENCONTRADA
        ================================= */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>

    </>
  );
}


/* =========================================
   ROOT
========================================= */

export default function Root() {

  return (

    <BrowserRouter>

      <AppErrorBoundary>

        <App />

      </AppErrorBoundary>

    </BrowserRouter>

  );

}
