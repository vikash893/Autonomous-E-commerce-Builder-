const express = require("express");
const mongoose = require("mongoose");
const User = require("../models/User");
const Project = require("../models/Project");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// ========================================
// GET ALL USERS
// GET /api/users
// ========================================
router.get("/", async (req, res) => {
    try {
        const users = await User.find().select("-password").sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error("GET ALL USERS ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// ========================================
// GET USER BY ID
// GET /api/users/:id
// ========================================
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: "Invalid user ID format"
            });
        }

        const user = await User.findById(id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        const projects = await Project.find({ user: id }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
                projects
            }
        });
    } catch (error) {
        console.error("GET USER BY ID ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// ========================================
// DELETE USER BY ID
// DELETE /api/users/:id
// ========================================
router.delete("/:id", protect, async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: "Invalid user ID format"
            });
        }

        // Only allowed if deleting self or if user is ADMIN
        if (req.user.userId !== id && req.user.role !== "ADMIN") {
            return res.status(403).json({
                success: false,
                error: "Not authorized to delete this user"
            });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        // Delete user projects
        await Project.deleteMany({ user: id });

        return res.status(200).json({
            success: true,
            message: "User deleted successfully",
            deletedUser: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });
    } catch (error) {
        console.error("DELETE USER ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

module.exports = router;
