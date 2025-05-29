const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  category: { type: String, enum: ["Comida", "Bebida", "Postre"], required: true },
  price:    { type: Number, required: true, min: 0 }
});

module.exports = mongoose.model("Product", productSchema);