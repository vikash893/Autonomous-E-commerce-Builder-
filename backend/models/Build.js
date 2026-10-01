const mongoose = require("mongoose");

const buildSchema = new mongoose.Schema(
    {
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        store: {
            currency: {
                type: String,
                default: "₹"
            },
            theme: {
                primary: {
                    type: String,
                    default: "#6366F1"
                }
            },
            logoUrl: {
                type: String,
                default: ""
            }
        },
        modules: {
            type: [String],
            default: ["products", "cart", "auth", "orders"]
        },
        options: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        lastGeneratedAt: {
            type: Date,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Build", buildSchema);