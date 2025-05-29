const express = require("express");
const requireLogin = require("../middleware/requireLogin");
const Order = require("../models/Order");
const Product = require("../models/Product");
const Table = require("../models/Table");

module.exports = (io) => {
  const router = express.Router();

  router.get("/crear", requireLogin, async (req, res) => {
    try {
      const productos = await Product.find();
      const mesas = await Table.find();
      res.render("mesero_comandas", { productos, mesas, ordenes: [] });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al cargar productos o mesas");
    }
  });

  router.post("/crear", requireLogin, async (req, res) => {
    try {
      const { tableId, productIds = {}, quantities = {}, notes = {} } = req.body;

      if (!tableId) {
        return res.status(400).send("Se requiere el número de mesa");
      }

      const items = [];
      for (const cat of ["comida", "bebida", "postre"]) {
        const prodId = productIds[cat];
        let qty = parseInt(quantities[cat], 10);
        const note = notes[cat] || "";

        if (prodId && prodId !== "" && qty > 0) {
          items.push({ 
            product: prodId, 
            quantity: qty,
            notes: note
          });
        }
      }

      if (items.length === 0) {
        return res.status(400).send("Debe seleccionar al menos un producto con cantidad mayor a 0");
      }

      await Order.create({
        table: tableId,
        items,
        status: "Pendiente",
        createdAt: new Date(),
      });

      io.emit("comandaCreada");
      res.redirect("/mesero/comandas");
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al crear la comanda");
    }
  });

  router.get("/comandas", requireLogin, async (req, res) => {
    try {
      const comandas = await Order.find()
        .populate("items.product")
        .populate("table")
        .sort({ createdAt: -1 });

      const productos = await Product.find();
      const mesas = await Table.find();

      res.render("mesero_comandas", { ordenes: comandas, productos, mesas });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al cargar las comandas");
    }
  });

  return router;
};