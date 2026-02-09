const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
    categoryName: {
        type: String,
        unique: true,
        required: true
    },
    isBNPC: {
        type: Boolean,
        default: false
    },
}, { timestamps: true })

module.exports = mongoose.model("Category", categorySchema)