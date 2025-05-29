require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB conectado");

    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(express.static(path.join(__dirname, "public")));

    app.set("view engine", "ejs");
    app.set("views", path.join(__dirname, "views"));

    app.use(
      session({
        secret: process.env.SESSION_SECRET || "secreto_cemitas",
        resave: false,
        saveUninitialized: false,
        store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
        cookie: { maxAge: 1000 * 60 * 60 },
      })
    );
    
    // Agregar esto después de app.use(session(...)) y antes de las rutas
    app.use((req, res, next) => {
      // Pasar datos de usuario a todas las vistas
      res.locals.user = req.session.user || null;
      next();
    });

    // Importar rutas: todas las que usan io deben exportar función que recibe io
    const authRoutes = require("./routes/auth");           // no recibe io
    const indexRoutes = require("./routes/index")(io);      // recibe io
    const meseroRoutes = require("./routes/mesero")(io);    // recibe io
    const adminRoutes = require("./routes/admin");          // no recibe io
    const cocinaRoutes = require("./routes/cocina")(io);    // recibe io
    const cajaRoutes = require("./routes/caja");            // no recibe io
    const comandasRoutes = require("./routes/comandas");    // no recibe io

    // Usar rutas
    app.use("/", authRoutes);
    app.use("/", indexRoutes);
    app.use("/mesero", meseroRoutes);
    app.use("/admin", adminRoutes);
    app.use("/cocina", cocinaRoutes);
    app.use("/caja", cajaRoutes);
    app.use("/comandas", comandasRoutes);

    io.on("connection", (socket) => {
      console.log("🔌 Nuevo cliente conectado:", socket.id);
      socket.on("disconnect", () => {
        console.log("❌ Cliente desconectado:", socket.id);
      });
    });

    // Manejo básico de rutas no encontradas
    app.use((req, res) => {
      res.status(404).send("Página no encontrada");
    });

    // Manejo de errores generales
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).send("Error interno del servidor");
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Servidor listo en http://localhost:${PORT}/login`);
    });
  } catch (error) {
    console.error("❌ Error al iniciar el servidor:", error);
  }
}

startServer();
