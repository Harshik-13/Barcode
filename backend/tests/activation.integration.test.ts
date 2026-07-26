import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { initDb, closeDb, getDb } from '../src/db';
import app from '../src/app';

let adminToken: string;

const adminLogin = () => request(app).post('/api/auth/login').send({ email: 'admin@workspace.com', password: 'Harshverse' });

function createStudent(roll: string, name: string) {
  return request(app)
    .post('/api/students')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ roll, name });
}

async function getStudentId(roll: string): Promise<number> {
  const db = getDb();
  const result = await db.query('SELECT id FROM students WHERE roll = $1', [roll]);
  return result.rows[0].id as number;
}

beforeAll(async () => {
  await initDb();
  const adminRes = await adminLogin();
  adminToken = adminRes.body.token;

  // Create test students for activation tests
  await createStudent('ACT001', 'Activation Test One');
  await createStudent('ACT002', 'Activation Test Two');
  await createStudent('ACT003', 'Activation Test Three');
  await createStudent('ACT004', 'Activation Test Four');
  await createStudent('ACT005', 'Activation Test Five');
  await createStudent('ACT006', 'Activation Test Six');
}, 15000);

afterAll(async () => {
  await closeDb();
});

describe('POST /api/activation/start', () => {
  it('should send OTP for valid roll number', async () => {
    const res = await request(app).post('/api/activation/start').send({ roll: 'ACT001' });
    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('OTP sent');
    expect(res.body.data.emailDomain).toBe('@vnrvjiet.in');
  });

  it('should return 404 for unknown roll', async () => {
    const res = await request(app).post('/api/activation/start').send({ roll: 'ZZZZZZ' });
    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Student account not found');
  });

  it('should reject missing roll', async () => {
    const res = await request(app).post('/api/activation/start').send({});
    expect(res.status).toBe(400);
  });
});

describe('POST /api/activation/verify-otp', () => {
  it('should reject invalid roll', async () => {
    const res = await request(app).post('/api/activation/verify-otp').send({ roll: 'ZZZZZZ', otp: '123456' });
    expect(res.status).toBe(404);
  });

  it('should reject invalid OTP', async () => {
    await request(app).post('/api/activation/start').send({ roll: 'ACT002' });

    const res = await request(app).post('/api/activation/verify-otp').send({ roll: 'ACT002', otp: '000000' });
    expect(res.status).toBe(422);
    expect(res.body.message).toContain('Invalid OTP');
  });

  it('should reject expired OTP', async () => {
    await request(app).post('/api/activation/start').send({ roll: 'ACT003' });

    const db = getDb();
    const sid = await getStudentId('ACT003');
    await db.query('UPDATE activation_otps SET expires_at = $1 WHERE student_id = $2 AND is_used = 0', [new Date(Date.now() - 60000).toISOString(), sid]);

    const res = await request(app).post('/api/activation/verify-otp').send({ roll: 'ACT003', otp: '123456' });
    expect(res.status).toBe(422);
    expect(res.body.message).toContain('OTP has expired');
  });

  it('should reject requests without roll or otp', async () => {
    const res1 = await request(app).post('/api/activation/verify-otp').send({ otp: '123456' });
    expect(res1.status).toBe(400);

    const res2 = await request(app).post('/api/activation/verify-otp').send({ roll: 'ACT001' });
    expect(res2.status).toBe(400);
  });
});

describe('POST /api/activation/set-password', () => {
  it('should reject weak password', async () => {
    const res = await request(app).post('/api/activation/set-password').send({ activationToken: 'some-token', password: 'short' });
    // Validation middleware catches this first (400) before service layer (422)
    expect(res.status === 400 || res.status === 422).toBe(true);
  });

  it('should reject missing activationToken', async () => {
    const res = await request(app).post('/api/activation/set-password').send({ password: 'longenoughpassword' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/activation/resend-otp', () => {
  it('should resend OTP for valid roll', async () => {
    await request(app).post('/api/activation/start').send({ roll: 'ACT004' });

    const res = await request(app).post('/api/activation/resend-otp').send({ roll: 'ACT004' });
    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain('OTP resent');
  });

  it('should reject unknown roll', async () => {
    const res = await request(app).post('/api/activation/resend-otp').send({ roll: 'ZZZZZZ' });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/auth/login — existing flow still works', () => {
  it('should login admin with email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@workspace.com', password: 'Harshverse' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('admin');
  });

  it('should login faculty with email', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'faculty@workspace.com', password: 'faculty123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('faculty');
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@workspace.com', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });
});
