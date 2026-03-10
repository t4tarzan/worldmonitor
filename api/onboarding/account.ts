import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, fullName } = req.body;

  // Mock user creation for localhost demo
  const userId = 'demo-user-' + Math.random().toString(36).substring(7);
  const token = 'demo-token-' + Math.random().toString(36).substring(7);

  return res.status(201).json({
    success: true,
    user: {
      id: userId,
      email,
      full_name: fullName,
      plan_tier: 'free',
      created_at: new Date().toISOString()
    },
    token
  });
}
