const mongoose = require("mongoose");

const catalogVersionSchema = new mongoose.Schema(
  {
    version: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CatalogVersion", catalogVersionSchema);
