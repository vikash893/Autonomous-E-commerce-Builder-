const jwt = require("jsonwebtoken");

// Verify JWT and attach user to req.user
const protect = (req, res, next) => {
    const header = req.headers.authorization || "";

    if (!header.startsWith("Bearer ")) {
        return res.status(401).json({
            success: false,
            error: "Login required"
        });
    }

    try {
        const decoded = jwt.verify(
            header.slice(7),
            process.env.JWT_SECRET
        );

        req.user = decoded;
        next();
    } catch {
        return res.status(401).json({
            success: false,
            error: "Invalid or expired token"
        });
    }
};

// Require ADMIN role (use after protect)
const adminOnly = (req, res, next) => {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({
            success: false,
            error: "Admin access required"
        });
    }

    next();
};

module.exports = { protect, adminOnly };