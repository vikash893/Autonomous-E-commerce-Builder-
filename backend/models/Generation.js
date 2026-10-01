const mongoose = require("mongoose");

const generationSchema = new mongoose.Schema(
    {
        buildId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Build"
        },
        ownerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        storeName: {
            type: String,
            default: ""
        },
        resolvedModules: {
            type: [String],
            default: []
        },
        fileCount: {
            type: Number,
            default: 0
        },
        sizeBytes: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            enum: ["SUCCESS", "FAILED"],
            default: "SUCCESS"
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Generation", generationSchema);