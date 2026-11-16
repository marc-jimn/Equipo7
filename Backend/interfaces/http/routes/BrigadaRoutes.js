import { Router } from "express";

export const crearBrigadaRoutes = (controller) => {

  const router = Router();

  // Registrar brigada.
  router.post("/", controller.crear);

  // Obtener todas las brigadas.
  router.get("/", controller.obtenerTodos);

  // Asignar o reemplazar los cinco integrantes.
  router.put("/:id/integrantes", controller.asignarIntegrantes);

  // Asignar o reemplazar las localidades.
  router.put("/:id/localidades", controller.asignarLocalidades);

  // Obtener brigada por ID.
  router.get("/:id", controller.obtenerPorId);

  // Actualizar datos generales.
  router.put("/:id", controller.actualizar);

  return router;
};