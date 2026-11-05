import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { api, auth, clearDb, registerUser, startDb, stopDb } from './helpers.js';

beforeAll(startDb);
afterAll(stopDb);
beforeEach(clearDb);

describe('auth', () => {
  it('registers a customer and never returns the password', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'Asha', email: 'ASHA@Test.dev', password: 'Secret123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user).toMatchObject({ name: 'Asha', email: 'asha@test.dev', role: 'customer' });
    expect(res.body.user.password).toBeUndefined();
  });

  it('ignores a client-supplied role (no privilege escalation)', async () => {
    const res = await api().post('/api/auth/register').send({ name: 'Mallory', email: 'm@test.dev', password: 'Secret123', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('customer');
  });

  it('rejects weak passwords and bad emails', async () => {
    const weak = await api().post('/api/auth/register').send({ name: 'Bob', email: 'bob@test.dev', password: 'short' });
    expect(weak.status).toBe(400);
    const badEmail = await api().post('/api/auth/register').send({ name: 'Bob', email: 'nope', password: 'Secret123' });
    expect(badEmail.status).toBe(400);
    expect(badEmail.body.details[0].field).toBe('email');
  });

  it('rejects duplicate emails', async () => {
    await registerUser({ email: 'dup@test.dev' });
    const res = await api().post('/api/auth/register').send({ name: 'Dup', email: 'dup@test.dev', password: 'Secret123' });
    expect(res.status).toBe(409);
  });

  it('logs in with correct credentials and rejects wrong ones identically', async () => {
    const { credentials } = await registerUser();
    const ok = await api().post('/api/auth/login').send({ email: credentials.email, password: credentials.password });
    expect(ok.status).toBe(200);
    const badPw = await api().post('/api/auth/login').send({ email: credentials.email, password: 'WrongPass1' });
    const noUser = await api().post('/api/auth/login').send({ email: 'ghost@test.dev', password: 'WrongPass1' });
    expect(badPw.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(badPw.body.message).toBe(noUser.body.message);
  });

  it('protects /me and accepts a valid token', async () => {
    expect((await api().get('/api/auth/me')).status).toBe(401);
    expect((await api().get('/api/auth/me').set(auth('garbage'))).status).toBe(401);
    const { token, user } = await registerUser();
    const res = await api().get('/api/auth/me').set(auth(token));
    expect(res.status).toBe(200);
    expect(res.body.user._id).toBe(user._id);
  });

  it('rejects expired tokens', async () => {
    const { user } = await registerUser();
    const expired = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: -10 });
    expect((await api().get('/api/auth/me').set(auth(expired))).status).toBe(401);
  });

  it('changes password only with the correct current password', async () => {
    const { token, credentials } = await registerUser();
    const bad = await api().put('/api/auth/profile').set(auth(token)).send({ currentPassword: 'nope12345', newPassword: 'Brand3wPass' });
    expect(bad.status).toBe(400);
    const ok = await api().put('/api/auth/profile').set(auth(token)).send({ currentPassword: credentials.password, newPassword: 'Brand3wPass' });
    expect(ok.status).toBe(200);
    const login = await api().post('/api/auth/login').send({ email: credentials.email, password: 'Brand3wPass' });
    expect(login.status).toBe(200);
  });
});
