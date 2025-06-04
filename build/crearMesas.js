const mongoose = require("mongoose");
const Table = require("../models/Table");

async function main() {
  try {
    await mongoose.connect("mongodb+srv://JEnriqueRMejia:251102@cluster0.3lzk7ik.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB conectado");

    // Limpia la colección de mesas para no duplicar
    await Table.deleteMany({});

    // Crea las mesas con números
    await Table.insertMany([
      { number: 1 },
      { number: 2 },
      { number: 3 },
      { number: 4 },
      { number: 5 },
      { number: 6 },
      { number: 7 },
      { number: 8 },
    ]);

    console.log("Mesas creadas");

    await mongoose.disconnect();
  } catch (error) {
    console.error(error);
  }
}

main();