const jwt = require('jsonwebtoken');

const fail = (status, code, message) => Object.assign(new Error(message), { status, code });

exports.optionalAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    } catch {}
  }
  next();
};

exports.protect = (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next(fail(401, 'UNAUTHENTICATED', 'Login required'));
  try {
    req.user = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    next();
  } catch {
    next(fail(401, 'UNAUTHENTICATED', 'Invalid or expired token'));
  }
};

exports.adminOnly = (req, res, next) =>
  req.user?.role === 'ADMIN' ? next() : next(fail(403, 'FORBIDDEN', 'Admins only'));
