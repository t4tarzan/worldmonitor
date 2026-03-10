import type { VercelRequest, VercelResponse } from '@vercel/node';
import { hash } from 'bcryptjs';
import { randomBytes } from 'crypto';

// This would connect to your Neon Postgres database
// Example using node-postgres
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password, fullName } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const passwordHash = await hash(password, 10);

    // Create verification token
    const verificationToken = randomBytes(32).toString('hex');

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, plan_tier, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, plan_tier, created_at`,
      [email.toLowerCase(), passwordHash, fullName || null, 'free', false]
    );

    const user = result.rows[0];

    // Create email verification token
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')`,
      [user.id, verificationToken]
    );

    // TODO: Send verification email
    // await sendVerificationEmail(email, verificationToken);

    // Log registration
    await pool.query(
      `INSERT INTO usage_logs (user_id, action, metadata, ip_address)
       VALUES ($1, $2, $3, $4)`,
      [
        user.id,
        'user.registered',
        JSON.stringify({ method: 'email' }),
        req.headers['x-forwarded-for'] || req.socket.remoteAddress
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        planTier: user.plan_tier,
        createdAt: user.created_at
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
