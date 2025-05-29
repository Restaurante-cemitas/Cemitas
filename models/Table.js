const mongoose = require("mongoose");

const TableSchema = new mongoose.Schema({
  number: Number,
  status: { type: String, enum: ["Libre", "Ocupada"], default: "Libre" }
});

module.exports = mongoose.model("Table", TableSchema);