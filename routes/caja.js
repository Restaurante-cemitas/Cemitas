const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

function requireCaja(req, res, next) {
  if (!req.session.user || req.session.user.role !== "CAJA") {
    return res.status(403).send("Acceso denegado");
  }
  next();
}

router.get("/", requireCaja, async (req, res) => {
  try {
    const ordenes = await Order.find({ status: { $ne: "Cerrada" } })
                             .populate("table")
                             .populate("items.product");
    
    res.render("caja", { 
      ordenes,
      user: req.session.user // Pasar el usuario completo de la sesión
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar las órdenes");
  }
});

router.post("/cerrar/:id", requireCaja, async (req, res) => {
  try {
    const orden = await Order.findById(req.params.id)
                           .populate("table")
                           .populate("items.product");
    if (!orden) return res.status(404).send("Orden no encontrada");

    orden.status = "Cerrada";
    orden.closedAt = new Date();
    await orden.save();

    res.redirect(`/caja/imprimir/${req.params.id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cerrar la orden");
  }
});

router.get("/imprimir/:id", requireCaja, async (req, res) => {
  try {
    const orden = await Order.findById(req.params.id)
                           .populate("table")
                           .populate("items.product");
    if (!orden) return res.status(404).send("Orden no encontrada");

    if (!orden.printed) {
      orden.printed = true;
      await orden.save();
    }

    res.render("caja_ticket", { orden });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al generar el ticket");
  }
});

router.post('/ticket-impreso/:id', requireCaja, async (req, res) => {
  try {
    const orden = await Order.findById(req.params.id);
    if (orden) {
      orden.printed = true;
      await orden.save();
    }
    res.sendStatus(200);
  } catch (error) {
    console.error(error);
    res.sendStatus(500);
  }
});

module.exports = router;