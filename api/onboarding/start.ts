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

  // Mock session creation for localhost demo
  const sessionToken = 'demo-session-' + Math.random().toString(36).substring(7);

  return res.status(201).json({
    success: true,
    session: {
      id: 'demo-session-id',
      session_token: sessionToken,
      current_step: 1,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }
  });
}
