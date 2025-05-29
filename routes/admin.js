const express  = require("express");
const bcrypt   = require("bcryptjs");
const router   = express.Router();

const Product  = require("../models/Product");
const Order    = require("../models/Order");
const User     = require("../models/User");

/* ───────────────  Middleware ─────────────── */
function requireAdmin(req, res, next) {
  if (!req.session.user || req.session.user.role !== "ADMIN") {
    return res.status(403).send("Acceso denegado");
  }
  next();
}

/* ────────────────  DASHBOARD ADMIN ─────────────── */
router.get("/", requireAdmin, (req, res) => {
  res.render("dashboard_admin", { user: req.session.user });
});

/* ────────────────  PRODUCTOS  ─────────────── */
/* GET  /admin/productos */
router.get("/productos", requireAdmin, async (req, res) => {
  const productos = await Product.find().lean();
  res.render("admin_productos", { productos, user: req.session.user });
});

/* POST /admin/productos  (crear) */
router.post("/productos", requireAdmin, async (req, res) => {
  let { name, category, price } = req.body;
  category = capitalizar(category); // Capitalizar categoría
  await Product.create({ name, category, price });
  res.redirect("/admin/productos");
});

/* POST /admin/productos/editar/:id */
router.post("/productos/editar/:id", requireAdmin, async (req, res) => {
  let { name, category, price } = req.body;
  category = capitalizar(category);
  await Product.findByIdAndUpdate(req.params.id, { name, category, price });
  res.redirect("/admin/productos");
});

/* POST /admin/productos/eliminar/:id */
router.post("/productos/eliminar/:id", requireAdmin, async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.redirect("/admin/productos");
});

/* ────────────────  USUARIOS  ─────────────── */
router.get("/usuarios", requireAdmin, async (req, res) => {
  const usuarios = await User.find().lean();
  res.render("admin_usuarios", { usuarios, user: req.session.user });
});

router.post("/usuarios", requireAdmin, async (req, res) => {
  const { username, email, password, role } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  await User.create({ username, email, password: hashed, role });
  res.redirect("/admin/usuarios");
});

router.get("/usuarios/editar/:id", requireAdmin, async (req, res) => {
  const usuario = await User.findById(req.params.id).lean();
  if (!usuario) return res.status(404).send("Usuario no encontrado");
  res.render("admin_usuarios_editar", { usuario, user: req.session.user });
});

router.post("/usuarios/editar/:id", requireAdmin, async (req, res) => {
  const { username, email, role, password } = req.body;
  const update = { username, email, role };
  if (password?.trim()) update.password = await bcrypt.hash(password, 10);
  await User.findByIdAndUpdate(req.params.id, update);
  res.redirect("/admin/usuarios");
});

router.post("/usuarios/eliminar/:id", requireAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect("/admin/usuarios");
});

/* ────────────────  REPORTES  ─────────────── */
router.get("/reportes", requireAdmin, async (req, res) => {
  const { desde = "", hasta = "" } = req.query;

  const filtro = { status: "Cerrada" };
  if (desde || hasta) {
    filtro.closedAt = {};
    if (desde) filtro.closedAt.$gte = new Date(desde);
    if (hasta) {
      const h = new Date(hasta);
      h.setHours(23, 59, 59, 999);
      filtro.closedAt.$lte = h;
    }
  }

  const ordenes = await Order.find(filtro).populate("items.product");
  let totalDia = 0;
  const productos = {};

  ordenes.forEach(o => {
    o.items.forEach(i => {
      if (!i.product) return;
      const subtotal = i.quantity * i.product.price;
      totalDia += subtotal;
      productos[i.product.name] = (productos[i.product.name] || 0) + subtotal;
    });
  });

  res.render("reportes", { totalDia, productos, user: req.session.user, desde, hasta });
});

/* Utilidad para capitalizar 'comida' -> 'Comida' */
function capitalizar(txt = "") {
  return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
}

module.exports = router;
