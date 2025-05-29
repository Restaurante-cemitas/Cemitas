const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },

  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, min: 1, required: true },
    notes: { type: String, default: "" }
  }],

  status: {
    type: String,
    enum: ["Pendiente", "En preparación", "Lista", "Servida", "Cerrada"],
    default: "Pendiente"
  },

  printed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  closedAt: { type: Date }
});

module.exports = mongoose.model("Order", orderSchema);