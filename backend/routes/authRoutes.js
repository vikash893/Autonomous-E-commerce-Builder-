const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

const validate = require("../middleware/validate");

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
                password
            } = req.body;

            const existingUser = await User.findOne({
                email
            });

            if (existingUser) {
                return res.status(409).json({
                    success: false,
                    error: "User already exists"
                });
            }

            const hashedPassword =
                await bcrypt.hash(password, 12);

            const user = await User.create({
                name,
                email,
                password: hashedPassword
            });

            return res.status(201).json({
                success: true,
                message: "User registered successfully",
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email
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
                email
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
                    email: user.email
                },
                process.env.JWT_SECRET,
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
                    email: user.email
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

module.exports = router;