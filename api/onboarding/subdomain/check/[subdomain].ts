import type { VercelRequest, VercelResponse } from '@vercel/node';

const RESERVED_SUBDOMAINS = ['www', 'api', 'admin', 'dashboard', 'app', 'mail', 'test', 'demo'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subdomain } = req.query;
  const subdomainStr = Array.isArray(subdomain) ? subdomain[0] : subdomain;

  if (!subdomainStr) {
    return res.status(400).json({ error: 'Subdomain is required' });
  }

  // Check if reserved
  const isReserved = RESERVED_SUBDOMAINS.includes(subdomainStr.toLowerCase());
  
  // For demo, simulate some taken subdomains
  const takenSubdomains = ['john', 'demo', 'test', 'admin'];
  const isTaken = takenSubdomains.includes(subdomainStr.toLowerCase());

  const available = !isReserved && !isTaken;

  return res.status(200).json({
    available,
    subdomain: subdomainStr,
    suggestion: available ? null : `${subdomainStr}${Math.floor(Math.random() * 100)}`
  });
}
