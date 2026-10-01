const { z } = require("zod");

// POST /api/auth/register
const registerSchema = z.object({
    body: z.object({
        name: z
            .string({ required_error: "Name is required" })
            .min(2, "Name must be at least 2 characters")
            .max(60, "Name must be at most 60 characters"),
        email: z
            .string({ required_error: "Email is required" })
            .email("Invalid email address"),
        password: z
            .string({ required_error: "Password is required" })
            .min(6, "Password must be at least 6 characters")
    }),
    params: z.object({}).optional(),
    query: z.object({}).optional()
});

// POST /api/auth/login
const loginSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: "Email is required" })
            .email("Invalid email address"),
        password: z
            .string({ required_error: "Password is required" })
            .min(1, "Password is required")
    }),
    params: z.object({}).optional(),
    query: z.object({}).optional()
});

module.exports = { registerSchema, loginSchema };