import { Router } from "express";
import { uploadFoto } from "../middlewares/uploadFoto.js";

export const crearPersonalRoutes = (
  controller,
  verificarPermiso
) => {

  const router = Router();

  // Registrar personal.
  router.post(
    "/",
    verificarPermiso("personal.crear"),
    controller.crear
  );

  // Consultar todo el personal.
  router.get(
    "/",
    verificarPermiso("personal.ver"),
    controller.obtenerTodos
  );

  // Consultar un registro.
  router.get(
    "/:id",
    verificarPermiso("personal.ver"),
    controller.obtenerPorId
  );

  // Actualizar personal.
  router.put(
    "/:id",
    verificarPermiso("personal.editar"),
    controller.actualizar
  );

  // Actualizar fotografía.
  router.post(
    "/:id/foto",
    verificarPermiso("personal.editar"),
    uploadFoto.single("foto"),
    controller.subirFoto
  );

  return router;
};