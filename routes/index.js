const express = require("express");
const router = express.Router();
const PDFDocument = require("pdfkit");
const { Buffer } = require("buffer");

const Order = require("../models/Order");
const Product = require("../models/Product");
const Table = require("../models/Table");
const User = require("../models/User");

/* ---------------------------------- helpers --------------------------------- */
function requireLogin(req, res, next) {
  if (!req.session.user) return res.redirect("/login");
  next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.session.user || req.session.user.role !== role) {
      return res.status(403).send("Acceso denegado");
    }
    next();
  };
}

module.exports = (io) => {
  // Puedes usar io aquí si quieres emitir eventos dentro de las rutas

  /* ------------------------------ rutas públicas ------------------------------ */
  router.get("/", (_req, res) => {
    res.redirect("/login");
  });

  /* ------------------------------ Login real ---------------------------------- */
  router.get("/login", (_req, res) => {
    res.render("login", { error: null });
  });

  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });

      if (!user) {
        return res.render("login", { error: "Usuario no encontrado" });
      }

      const validPassword = await user.comparePassword(password);
      if (!validPassword) {
        return res.render("login", { error: "Contraseña incorrecta" });
      }

      req.session.user = {
        id: user._id,
        email: user.email,
        role: user.role
      };

      const redirects = {
        MESERO: "/mesero",
        COCINA: "/cocina",
        CAJA: "/caja",
        ADMIN: "/admin"
      };

      return res.redirect(redirects[user.role] || "/");

    } catch (err) {
      console.error("❌ Error en login:", err);
      res.status(500).render("login", { error: "Error en el servidor" });
    }
  });

  /* ------------------------ Logout (destruir sesión) -------------------------- */
  router.get("/logout", (req, res) => {
    req.session.destroy(() => res.redirect("/login"));
  });

  /* ----------------------------- CAJA – Factura ------------------------------- */
  router.get(
    "/caja/factura/:orderId",
    requireLogin,
    requireRole("CAJA"),
    async (req, res) => {
      try {
        const orden = await Order.findById(req.params.orderId)
          .populate("items.product")
          .populate("table");

        if (!orden) return res.status(404).send("Orden no encontrada");
        res.render("factura", { orden, user: req.session.user });
      } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar factura");
      }
    }
  );

  /* -------- CAJA – Generar factura PDF (sin correo, solo descarga/preview) ---- */
  router.post(
    "/caja/factura/:orderId",
    requireLogin,
    requireRole("CAJA"),
    async (req, res) => {
      try {
        const { nombre, rfc } = req.body;
        const orden = await Order.findById(req.params.orderId)
          .populate("items.product")
          .populate("table");

        if (!orden) return res.status(404).send("Orden no encontrada");

        const total = orden.items.reduce(
          (acc, it) =>
            it.product?.price ? acc + it.product.price * it.quantity : acc,
          0
        );

        const doc = new PDFDocument({ margin: 30, size: "A4" });
        const buffers = [];
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => {
          const pdfData = Buffer.concat(buffers);
          const pdfBase64 = pdfData.toString("base64");

          res.send(`
            <html>
            <head>
              <title>Factura generada</title>
              <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
            </head>
            <body class="container mt-4">
              <h1 class="mb-3">Factura generada</h1>
              <iframe src="data:application/pdf;base64,${pdfBase64}" width="600" height="400"></iframe>
              <br>
              <a href="data:application/pdf;base64,${pdfBase64}"
                 download="factura_${orden._id}.pdf"
                 class="btn btn-primary mt-3">
                 Descargar factura (PDF)
              </a>
              <a href="/caja" class="btn btn-link mt-3">Volver a caja</a>
            </body>
            </html>
          `);
        });

        doc.fontSize(20).text("Factura de Consumo", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Nombre: ${nombre}`);
        doc.text(`RFC: ${rfc}`);
        doc.text(`Orden ID: ${orden._id}`);
        doc.text(`Mesa: ${orden.table ? orden.table.name || orden.table._id : "N/A"}`);
        doc.text(`Fecha: ${new Date().toLocaleString()}`);
        doc.moveDown();

        doc.text("Productos:", { underline: true });
        orden.items.forEach((it) => {
          if (it.product?.price) {
            doc.text(
              `${it.quantity} x ${it.product.name} - $${it.product.price.toFixed(2)} c/u = $${(it.product.price * it.quantity).toFixed(2)}`
            );
          }
        });
        doc.moveDown();
        doc.text(`Total: $${total.toFixed(2)}`, { bold: true });
        doc.end();
      } catch (err) {
        console.error(err);
        res.status(500).send("Error al generar factura");
      }
    }
  );

  return router;
};
