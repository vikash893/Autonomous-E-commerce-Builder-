const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

router.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }));

const fail = (status, code, message) => Object.assign(new Error(message), { status, code });
const sign = (u) => jwt.sign({ id: u._id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) throw fail(400, 'VALIDATION_ERROR', 'Name, email and a 6+ char password are required');
    if (await User.findOne({ email: email.toLowerCase() })) throw fail(409, 'CONFLICT', 'Email already registered');
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({ success: true, data: { token: sign(user), user: { id: user._id, name, email, role: user.role } } });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const user = await User.findOne({ email: (req.body.email || '').toLowerCase() });
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) throw fail(401, 'UNAUTHENTICATED', 'Wrong email or password');
    res.json({ success: true, data: { token: sign(user), user: { id: user._id, name: user.name, email: user.email, role: user.role } } });
  } catch (e) { next(e); }
});

module.exports = router;
