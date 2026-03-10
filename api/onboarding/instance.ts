import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { domainType, subdomain, customDomain } = req.body;

  const instanceId = 'demo-instance-' + Math.random().toString(36).substring(7);
  const deploymentUrl = domainType === 'subdomain' 
    ? `https://${subdomain}.worldmonitor.app`
    : `https://${customDomain}`;

  return res.status(201).json({
    success: true,
    instance: {
      id: instanceId,
      subdomain,
      custom_domain: customDomain,
      deployment_url: deploymentUrl,
      deployment_status: 'deployed'
    },
    verificationRequired: domainType === 'custom'
  });
}
