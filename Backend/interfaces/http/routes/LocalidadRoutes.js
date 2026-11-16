import { Router } from "express";

import LocalidadRepositoryPostgres from "../../../infrastructure/repositories/LocalidadRepositoryPostgres.js";

import ObtenerLocalidades from "../../../application/use-cases/ObtenerLocalidades.js";
import ObtenerLocalidadPorId from "../../../application/use-cases/ObtenerLocalidadPorId.js";
import CrearLocalidad from "../../../application/use-cases/CrearLocalidad.js";
import ActualizarLocalidad from "../../../application/use-cases/ActualizarLocalidad.js";
import CambiarEstadoLocalidad from "../../../application/use-cases/CambiarEstadoLocalidad.js";
import AsignarCampaniasLocalidades from "../../../application/use-cases/AsignarCampaniasLocalidades.js";

import LocalidadController from "../controllers/LocalidadController.js";

const router = Router();

const localidadRepository = new LocalidadRepositoryPostgres();

const controller = new LocalidadController({
  obtenerLocalidades: new ObtenerLocalidades(localidadRepository),
  obtenerLocalidadPorId: new ObtenerLocalidadPorId(localidadRepository),
  crearLocalidad: new CrearLocalidad(localidadRepository),
  actualizarLocalidad: new ActualizarLocalidad(localidadRepository),
  cambiarEstadoLocalidad: new CambiarEstadoLocalidad(localidadRepository),

  asignarCampaniasLocalidades: new AsignarCampaniasLocalidades(
    localidadRepository
  ),
});

router.get("/", controller.obtenerTodos.bind(controller));

router.put("/campanias/asignaciones", controller.asignarCampanias.bind(controller));

router.get("/:id", controller.obtenerPorId.bind(controller));

router.post("/", controller.crear.bind(controller));

router.put("/:id", controller.actualizar.bind(controller));

router.patch("/:id/estado", controller.cambiarEstado.bind(controller));

export default router;