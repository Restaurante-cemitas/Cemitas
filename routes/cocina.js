const express = require("express");
const Order = require("../models/Order");

// Middleware para verificar que es cocina y está autenticado
function requireCocina(req, res, next) {
  if (!req.session.userId || req.session.role !== "COCINA")
    return res.status(403).send("Acceso denegado");
  next();
}

module.exports = function(io) {
  const router = express.Router();

  // Ver comandas en preparación (Pendiente o Servida)
  router.get("/", requireCocina, async (req, res) => {
    try {
      const ordenes = await Order.find({ status: { $in: ["Pendiente", "Servida"] } })
        .populate("table")
        .populate("items.product")
        .lean();
      res.render("cocina", { ordenes, user: req.session.user });
    } catch (error) {
      console.error("Error obteniendo órdenes:", error);
      res.status(500).send("Error del servidor");
    }
  });

  // Marcar orden como Servida
  router.post("/ordenes/servir/:id", requireCocina, async (req, res) => {
    try {
      const orden = await Order.findById(req.params.id);
      if (!orden) return res.status(404).send("Orden no encontrada");

      orden.status = "Servida";
      await orden.save();

      // Emitir evento con la orden actualizada (populate para el cliente)
      const ordenCompleta = await Order.findById(orden._id)
        .populate("table")
        .populate("items.product")
        .lean();

      io.emit("ordenServida", ordenCompleta);

      res.redirect("/cocina");
    } catch (error) {
      console.error("Error al actualizar orden:", error);
      res.status(500).send("Error del servidor");
    }
  });

  return router;
};