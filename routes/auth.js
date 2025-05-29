const express = require("express");
const User = require("../models/User");

const router = express.Router();

router.get("/login", (req, res) => {
  if (req.session.userId) {
    // Ya está logueado, redirigir según rol
    switch (req.session.role) {
      case "MESERO":
        return res.redirect("/mesero/comandas");
      case "COCINA":
        return res.redirect("/cocina");
      case "CAJA":
        return res.redirect("/caja");
      case "ADMIN":
        return res.redirect("/admin");
      default:
        return res.redirect("/");
    }
  }
  res.render("login", { error: null });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.render("login", { error: "Usuario o contraseña incorrectos" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.render("login", { error: "Usuario o contraseña incorrectos" });
    }

    req.session.userId = user._id;
    req.session.role = user.role;
    req.session.user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    // Redirigir según rol
    switch (user.role) {
      case "MESERO":
        return res.redirect("/mesero/comandas");
      case "COCINA":
        return res.redirect("/cocina");
      case "CAJA":
        return res.redirect("/caja");
      case "ADMIN":
        return res.redirect("/admin");
      default:
        return res.redirect("/");
    }
  } catch (err) {
    console.error(err);
    res.render("login", { error: "Error interno del servidor" });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

module.exports = router;