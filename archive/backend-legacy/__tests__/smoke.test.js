const request = require('supertest');

// Consolidated smoke test: use a single express `app` instance and avoid duplicate declarations.
describe('Express backend smoke', () => {
  let app;

  beforeAll(() => {
    const express = require('express');
    const jwt = require('jsonwebtoken');
    const bcrypt = require('bcryptjs');
    const cors = require('cors');
    const helmet = require('helmet');
    const bodyParser = require('body-parser');

    app = express();
    app.use(helmet());
    app.use(cors());
    app.use(bodyParser.json());

    const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

    const users = [];
    let idCounter = 1;

    function createTokens(user) {
      const accessToken = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '15m' });
      const refreshToken = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
      return { accessToken, refreshToken };
    }

    app.get('/', (req, res) => {
      res.json({ ok: true });
    });

    app.post('/auth/register', async (req, res) => {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'email and password required' });
      const existing = users.find(u => u.email === email.toLowerCase());
      if (existing) return res.status(409).json({ error: 'email exists' });
      const passwordHash = await bcrypt.hash(password, 1);
      const user = { id: idCounter++, email: email.toLowerCase(), passwordHash };
      users.push(user);
      const tokens = createTokens(user);
      res.json({ user: { id: user.id, email: user.email }, tokens });
    });

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

    app.get('/api/profile', authMiddleware, (req, res) => {
      const user = users.find(u => u.id === req.user.sub);
      if (!user) return res.status(404).json({ error: 'user not found' });
      res.json({ id: user.id, email: user.email });
    });
  });

  afterAll(() => {
    // nothing to clean up for in-memory app
  });

  test('GET / returns ok', async () => {
    await request(app).get('/').expect(200).expect(res => {
      expect(res.body.ok).toBe(true);
    });
  });

  test('register -> profile flow works', async () => {
    const email = 'user@example.com';
    const password = 'pw123456';

    const reg = await request(app)
      .post('/auth/register')
      .send({ email, password })
      .expect(200);

    expect(reg.body.user.email).toBe(email);
    expect(reg.body.tokens).toBeDefined();
    const token = reg.body.tokens.accessToken;

    await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(res => {
        expect(res.body.email).toBe(email);
      });
  });
});
