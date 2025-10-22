require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const app = express();
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

// In-memory user store for scaffold/demo purposes
const users = []; // { id, email, passwordHash }
let idCounter = 1;

// Helper: create token
function createTokens(user) {
  const accessToken = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

// Public route
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Football Dashboard API (scaffold)' });
});

// Register
app.post('/auth/register', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });
  const existing = users.find(u => u.email === email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'email exists' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = { id: idCounter++, email: email.toLowerCase(), passwordHash };
  users.push(user);
  const tokens = createTokens(user);
  res.json({ user: { id: user.id, email: user.email }, tokens });
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === (email || '').toLowerCase());
  if (!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'invalid credentials' });
  const tokens = createTokens(user);
  res.json({ user: { id: user.id, email: user.email }, tokens });
});

// Middleware: protect
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'missing token' });
  const token = auth.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid token' });
  }
}

// Protected example endpoint
app.get('/api/profile', authMiddleware, (req, res) => {
  const user = users.find(u => u.id === req.user.sub);
  if (!user) return res.status(404).json({ error: 'user not found' });
  res.json({ id: user.id, email: user.email });
});

// Football API stub
app.get('/api/teams/:id/matches', (req, res) => {
  const teamId = req.params.id;
  // return stubbed data
  res.json({ teamId, matches: [{ id: 1, home: 'Team A', away: 'Team B', score: '2-1', date: '2025-10-21' }] });
});

app.listen(PORT, () => console.log(`Backend listening on http://localhost:${PORT}`));
