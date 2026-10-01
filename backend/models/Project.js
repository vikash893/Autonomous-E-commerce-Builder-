const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
    {
        projectName: {
            type: String,
            required: [true, "Project name is required"],
            trim: true
        },
        projectId: {
            type: String,
            required: [true, "Project ID is required"],
            unique: true,
            trim: true
        },
        description: {
            type: String,
            trim: true,
            default: ""
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Project", projectSchema);
