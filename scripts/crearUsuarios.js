const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  console.log("🔄 Eliminando usuarios anteriores...");
  await User.deleteMany({}); // Limpia la colección

  const usuarios = [
    { name: "Admin",  email: "admin@cemitas.com",  password: "admin123",  role: "ADMIN" },
    { name: "Mesero", email: "mesero@cemitas.com", password: "mesero123", role: "MESERO" },
    { name: "Cocina", email: "cocina@cemitas.com", password: "cocina123", role: "COCINA" },
    { name: "Caja",   email: "caja@cemitas.com",   password: "caja123",   role: "CAJA" }
  ];

  for (const usuario of usuarios) {
    const hashed = await bcrypt.hash(usuario.password, 10);
    await User.create({
      name: usuario.name,
      email: usuario.email,
      password: hashed,
      role: usuario.role
    });
    console.log(`✅ Usuario ${usuario.role} creado con email: ${usuario.email} y contraseña: ${usuario.password}`);
  }

  console.log("🎉 Todos los usuarios fueron creados correctamente.");
  process.exit();
}).catch(err => {
  console.error("❌ Error al conectar a MongoDB:", err);
});