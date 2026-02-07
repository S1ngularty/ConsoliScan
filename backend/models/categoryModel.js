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
    bnpcCategory: {
        type: String,
        enum: [
            "RICE",
            "CORN",
            "FRESH_MEAT",
            "FRESH_POULTRY",
            "FRESH_FISH",
            "VEGETABLES",
            "FRUITS",
            "EGGS",
            "COOKING_OIL",
            "SUGAR",
            "MILK",
            "COFFEE",
            "NOODLES",
            "SOAP",
            "DETERGENT",
            "CANNED_GOODS",
            "OTHERS"
        ],
        default: "OTHERS"
    },
    applicableTo: {
        type: [{
            type: String,
            enum: ["PWD", "SENIOR", "PROMO", "ALL"]
        }],
        default: []
    },
}, { timestamps: true })

module.exports = mongoose.model("Category", categorySchema)