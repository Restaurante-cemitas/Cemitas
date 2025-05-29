const express = require("express");
const router = express.Router();
const requireLogin = require("../middleware/requireLogin");
const Order = require("../models/Order");

router.get("/", requireLogin, async (req, res) => {
  try {
    const comandas = await Order.find().populate("items.product").sort({ createdAt: -1 });
    res.render("comandas", { comandas });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al cargar las comandas");
  }
});

router.post("/", requireLogin, async (req, res) => {
  try {
    const { comida, bebida, postre, tableId } = req.body;

    if (!tableId) {
      return res.status(400).send("Se requiere el número de mesa");
    }

    const items = [];

    if (comida) items.push({ product: comida, quantity: 1 });
    if (bebida) items.push({ product: bebida, quantity: 1 });
    if (postre) items.push({ product: postre, quantity: 1 });

    if (items.length === 0) {
      return res.status(400).send("Debe seleccionar al menos un producto");
    }

    await Order.create({
      table: tableId,
      items,
      status: "Pendiente",
      createdAt: new Date(),
    });

    res.redirect("/comandas");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al crear la comanda");
  }
});

module.exports = router;