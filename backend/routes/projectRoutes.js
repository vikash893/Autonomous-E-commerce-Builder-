const express = require("express");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const jwt = require("jsonwebtoken");

const router = express.Router();

// Helper to optionally extract user from token if present
const optionalAuth = (req, res, next) => {
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
        try {
            const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET || "default_jwt_secret");
            req.user = decoded;
        } catch {
            // ignore invalid optional token
        }
    }
    next();
};

// ========================================
// CREATE PROJECT
// POST /api/projects
// ========================================
router.post("/", optionalAuth, async (req, res) => {
    try {
        const { projectName, projectId, description, user } = req.body;

        if (!projectName) {
            return res.status(400).json({
                success: false,
                error: "Project name is required"
            });
        }

        // Generate projectId if not explicitly provided
        const finalProjectId = (projectId && projectId.trim()) 
            ? projectId.trim().toLowerCase().replace(/\s+/g, "-") 
            : `${projectName.toLowerCase().trim().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;

        const existingProject = await Project.findOne({ projectId: finalProjectId });
        if (existingProject) {
            return res.status(409).json({
                success: false,
                error: "A project with this project ID already exists"
            });
        }

        const projectOwner = (req.user && req.user.userId) || (user && mongoose.Types.ObjectId.isValid(user) ? user : undefined);

        const project = await Project.create({
            projectName: projectName.trim(),
            projectId: finalProjectId,
            description: description ? description.trim() : "",
            user: projectOwner
        });

        return res.status(201).json({
            success: true,
            message: "Project created successfully",
            project
        });
    } catch (error) {
        console.error("CREATE PROJECT ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// ========================================
// GET ALL PROJECTS (Filtered by authenticated user if logged in)
// GET /api/projects
// ========================================
router.get("/", optionalAuth, async (req, res) => {
    try {
        const query = {};
        
        // If user query param provided
        if (req.query.user && mongoose.Types.ObjectId.isValid(req.query.user)) {
            query.user = req.query.user;
        } else if (req.user && req.user.userId && req.query.all !== "true") {
            // By default, if token is provided and not specifically asking for all, show user's projects or all if admin
            if (req.user.role !== "ADMIN") {
                query.user = req.user.userId;
            }
        }

        const projects = await Project.find(query)
            .populate("user", "name email role")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: projects.length,
            projects
        });
    } catch (error) {
        console.error("GET PROJECTS ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// ========================================
// GET PROJECT BY ID OR PROJECT_ID
// GET /api/projects/:id
// ========================================
router.get("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        let query;
        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { $or: [{ _id: id }, { projectId: id }] };
        } else {
            query = { projectId: id };
        }

        const project = await Project.findOne(query).populate("user", "name email");

        if (!project) {
            return res.status(404).json({
                success: false,
                error: "Project not found"
            });
        }

        return res.status(200).json({
            success: true,
            project
        });
    } catch (error) {
        console.error("GET PROJECT ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

// ========================================
// DELETE PROJECT
// DELETE /api/projects/:id
// ========================================
router.delete("/:id", optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;

        let query;
        if (mongoose.Types.ObjectId.isValid(id)) {
            query = { $or: [{ _id: id }, { projectId: id }] };
        } else {
            query = { projectId: id };
        }

        const project = await Project.findOne(query);

        if (!project) {
            return res.status(404).json({
                success: false,
                error: "Project not found"
            });
        }

        // Check ownership if user logged in
        if (req.user && req.user.role !== "ADMIN" && project.user && project.user.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                error: "Not authorized to delete this project"
            });
        }

        await Project.findByIdAndDelete(project._id);

        return res.status(200).json({
            success: true,
            message: "Project deleted successfully",
            deletedProject: project
        });
    } catch (error) {
        console.error("DELETE PROJECT ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

module.exports = router;
