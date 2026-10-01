const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Project = require("../models/Project");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// =======================================================
// INITIAL ADMIN SEED ROUTE
// POST /api/admin/seed-admin
// =======================================================
router.post("/seed-admin", async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const existingAdmin = await User.findOne({ role: "ADMIN" });
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                error: "An admin account already exists. Please login."
            });
        }

        const adminName = name || "System Admin";
        const adminEmail = email || "admin@example.com";
        const adminPassword = password || "Admin@123456";

        const hashedPassword = await bcrypt.hash(adminPassword, 12);

        const admin = await User.create({
            name: adminName,
            email: adminEmail.toLowerCase().trim(),
            password: hashedPassword,
            role: "ADMIN"
        });

        return res.status(201).json({
            success: true,
            message: "Initial Admin created successfully",
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role
            }
        });
    } catch (error) {
        console.error("SEED ADMIN ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// Protect all remaining admin endpoints with JWT + ADMIN role
router.use(protect, adminOnly);

// =======================================================
// 1. DASHBOARD & SYSTEM STATS
// GET /api/admin/stats
// =======================================================
router.get("/stats", async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ role: "ADMIN" });
        const totalStandardUsers = totalUsers - totalAdmins;
        const totalProjects = await Project.countDocuments();

        const recentUsers = await User.find()
            .select("-password")
            .sort({ createdAt: -1 })
            .limit(5);

        const recentProjects = await Project.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 })
            .limit(5);

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalAdmins,
                totalStandardUsers,
                totalProjects
            },
            recentUsers,
            recentProjects
        });
    } catch (error) {
        console.error("ADMIN STATS ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// =======================================================
// 2. USER MANAGEMENT
// =======================================================

// GET /api/admin/users
router.get("/users", async (req, res) => {
    try {
        const { search, role, page = 1, limit = 10 } = req.query;

        const query = {};

        if (role) {
            query.role = role.toUpperCase();
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } }
            ];
        }

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

        const total = await User.countDocuments(query);
        const users = await User.find(query)
            .select("-password")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        return res.status(200).json({
            success: true,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            users
        });
    } catch (error) {
        console.error("ADMIN GET USERS ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// GET /api/admin/users/:id
router.get("/users/:id", async (req, res) => {
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
            user,
            projectsCount: projects.length,
            projects
        });
    } catch (error) {
        console.error("ADMIN GET USER ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// PATCH /api/admin/users/:id/role
router.patch("/users/:id/role", async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: "Invalid user ID format"
            });
        }

        if (!role || !["USER", "ADMIN"].includes(role.toUpperCase())) {
            return res.status(400).json({
                success: false,
                error: "Role must be 'USER' or 'ADMIN'"
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { role: role.toUpperCase() },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: `User role updated to ${updatedUser.role}`,
            user: updatedUser
        });
    } catch (error) {
        console.error("ADMIN CHANGE ROLE ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                error: "Invalid user ID format"
            });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        // Cascade delete associated projects
        const deleteProjectsResult = await Project.deleteMany({ user: id });

        return res.status(200).json({
            success: true,
            message: "User and associated projects deleted successfully",
            deletedUser: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
            deletedProjectsCount: deleteProjectsResult.deletedCount
        });
    } catch (error) {
        console.error("ADMIN DELETE USER ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// =======================================================
// 3. PROJECT MANAGEMENT
// =======================================================

// GET /api/admin/projects
router.get("/projects", async (req, res) => {
    try {
        const { search, page = 1, limit = 10 } = req.query;

        const query = {};
        if (search) {
            query.$or = [
                { projectName: { $regex: search, $options: "i" } },
                { projectId: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        const pageNum = parseInt(page, 10) || 1;
        const limitNum = parseInt(limit, 10) || 10;
        const skip = (pageNum - 1) * limitNum;

        const total = await Project.countDocuments(query);
        const projects = await Project.find(query)
            .populate("user", "name email role")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum);

        return res.status(200).json({
            success: true,
            total,
            page: pageNum,
            totalPages: Math.ceil(total / limitNum),
            projects
        });
    } catch (error) {
        console.error("ADMIN GET PROJECTS ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// DELETE /api/admin/projects/:id
router.delete("/projects/:id", async (req, res) => {
    try {
        const { id } = req.params;

        let query;
        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { $or: [{ _id: id }, { projectId: id }] };
        } else {
            query = { projectId: id };
        }

        const deletedProject = await Project.findOneAndDelete(query);

        if (!deletedProject) {
            return res.status(404).json({
                success: false,
                error: "Project not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Project deleted successfully",
            deletedProject
        });
    } catch (error) {
        console.error("ADMIN DELETE PROJECT ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

module.exports = router;
