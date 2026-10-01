const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const validate = require("../middleware/validate");
const { protect } = require("../middleware/authMiddleware");

const {
    registerSchema,
    loginSchema
} = require("../validation/authValidation");

const router = express.Router();

// ========================================
// REGISTER
// POST /api/auth/register
// ========================================
router.post(
    "/register",
    validate(registerSchema),
    async (req, res) => {
        try {
            const {
                name,
                email,
                password,
                role
            } = req.body;

            const existingUser = await User.findOne({
                email: email.toLowerCase().trim()
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: "User with this email already exists"
                });
            }

            const hashedPassword =
                await bcrypt.hash(password, 12);

            const userRole = role && ["USER", "ADMIN"].includes(role.toUpperCase()) 
                ? role.toUpperCase() 
                : "USER";

            const user = await User.create({
                name: name.trim(),
                email: email.toLowerCase().trim(),
                password: hashedPassword,
                role: userRole
            });

            const token = jwt.sign(
                {
                    userId: user._id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET || "default_jwt_secret",
                {
                    expiresIn: "7d"
                }
            );

            return res.status(201).json({
                success: true,
                message: "User registered successfully",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt
                }
            });

        } catch (error) {
            console.error("REGISTER ERROR:", error);

            return res.status(500).json({
                success: false,
                error: "Internal server error"
            });
        }
    }
);

// ========================================
// LOGIN
// POST /api/auth/login
// ========================================
router.post(
    "/login",
    validate(loginSchema),
    async (req, res) => {
        try {
            const {
                email,
                password
            } = req.body;

            const user = await User.findOne({
                email: email.toLowerCase().trim()
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: "Invalid email or password"
                });
            }

            const isPasswordCorrect =
                await bcrypt.compare(
                    password,
                    user.password
                );

            if (!isPasswordCorrect) {
                return res.status(401).json({
                    success: false,
                    error: "Invalid email or password"
                });
            }

            const token = jwt.sign(
                {
                    userId: user._id,
                    email: user.email,
                    role: user.role
                },
                process.env.JWT_SECRET || "default_jwt_secret",
                {
                    expiresIn: "7d"
                }
            );

            return res.status(200).json({
                success: true,
                message: "Login successful",
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    createdAt: user.createdAt
                }
            });

        } catch (error) {
            console.error("LOGIN ERROR:", error);

            return res.status(500).json({
                success: false,
                error: "Internal server error"
            });
        }
    }
);

// ========================================
// GET CURRENT LOGGED-IN USER
// GET /api/auth/me
// ========================================
router.get("/me", protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                error: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        console.error("GET ME ERROR:", error);
        return res.status(500).json({
            success: false,
            error: "Internal server error"
        });
    }
});

module.exports = router;