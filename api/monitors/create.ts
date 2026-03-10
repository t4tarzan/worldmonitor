import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verify } from 'jsonwebtoken';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

const MONITOR_LIMITS = {
  free: 3,
  pro: 15,
  enterprise: 999999
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.substring(7);
    const decoded = verify(token, JWT_SECRET) as any;
    const userId = decoded.userId;
    const planTier = decoded.planTier;

    const { name, description, type, config, alertChannels } = req.body;

    if (!name || !type || !config) {
      return res.status(400).json({ error: 'Name, type, and config are required' });
    }

    const validTypes = ['keyword', 'region', 'source', 'composite', 'custom'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid monitor type' });
    }

    const countResult = await pool.query(
      'SELECT COUNT(*) as count FROM monitors WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    const currentCount = parseInt(countResult.rows[0].count);
    const limit = MONITOR_LIMITS[planTier as keyof typeof MONITOR_LIMITS] || MONITOR_LIMITS.free;

    if (currentCount >= limit) {
      return res.status(403).json({
        error: 'Monitor limit reached',
        limit,
        current: currentCount,
        upgradeRequired: planTier === 'free'
      });
    }

    const result = await pool.query(
      `INSERT INTO monitors (user_id, name, description, type, config, alert_channels)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, description, type, config, alert_channels, is_active, created_at`,
      [
        userId,
        name,
        description || null,
        type,
        JSON.stringify(config),
        JSON.stringify(alertChannels || ['email'])
      ]
    );

    const monitor = result.rows[0];

    await pool.query(
      `INSERT INTO usage_logs (user_id, action, resource_type, resource_id, metadata)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, 'monitor.created', 'monitor', monitor.id, JSON.stringify({ type })]
    );

    return res.status(201).json({
      success: true,
      monitor: {
        id: monitor.id,
        name: monitor.name,
        description: monitor.description,
        type: monitor.type,
        config: monitor.config,
        alertChannels: monitor.alert_channels,
        isActive: monitor.is_active,
        createdAt: monitor.created_at
      }
    });

  } catch (error) {
    console.error('Create monitor error:', error);
    if (error instanceof Error && error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
}
