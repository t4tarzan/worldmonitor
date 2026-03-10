import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { Pool } from 'pg';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia'
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const userEmail = session.customer_email;

        const userResult = await pool.query(
          'SELECT id, plan_tier FROM users WHERE email = $1',
          [userEmail]
        );

        if (userResult.rows.length === 0) {
          console.error('User not found:', userEmail);
          break;
        }

        const userId = userResult.rows[0].id;

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;

        let planTier = 'free';
        if (priceId === process.env.STRIPE_PRICE_ID_PRO) {
          planTier = 'pro';
        } else if (priceId === process.env.STRIPE_PRICE_ID_ENTERPRISE) {
          planTier = 'enterprise';
        }

        await pool.query(
          `INSERT INTO subscriptions 
           (user_id, plan_tier, status, stripe_customer_id, stripe_subscription_id, 
            current_period_start, current_period_end)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (user_id) DO UPDATE
           SET plan_tier = $2, status = $3, stripe_subscription_id = $5,
               current_period_start = $6, current_period_end = $7, updated_at = NOW()`,
          [
            userId,
            planTier,
            subscription.status,
            customerId,
            subscriptionId,
            new Date(subscription.current_period_start * 1000),
            new Date(subscription.current_period_end * 1000)
          ]
        );

        await pool.query(
          'UPDATE users SET plan_tier = $1, updated_at = NOW() WHERE id = $2',
          [planTier, userId]
        );

        await pool.query(
          `INSERT INTO usage_logs (user_id, action, metadata)
           VALUES ($1, $2, $3)`,
          [userId, 'subscription.created', JSON.stringify({ planTier, subscriptionId })]
        );

        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await pool.query(
          `UPDATE subscriptions 
           SET status = $1, current_period_start = $2, current_period_end = $3,
               cancel_at_period_end = $4, updated_at = NOW()
           WHERE stripe_subscription_id = $5`,
          [
            subscription.status,
            new Date(subscription.current_period_start * 1000),
            new Date(subscription.current_period_end * 1000),
            subscription.cancel_at_period_end,
            subscription.id
          ]
        );

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        await pool.query(
          `UPDATE subscriptions SET status = $1, updated_at = NOW()
           WHERE stripe_subscription_id = $2`,
          ['canceled', subscription.id]
        );

        const subResult = await pool.query(
          'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
          [subscription.id]
        );

        if (subResult.rows.length > 0) {
          await pool.query(
            'UPDATE users SET plan_tier = $1, updated_at = NOW() WHERE id = $2',
            ['free', subResult.rows[0].user_id]
          );
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        
        if (invoice.subscription) {
          await pool.query(
            `UPDATE subscriptions SET status = $1, updated_at = NOW()
             WHERE stripe_subscription_id = $2`,
            ['past_due', invoice.subscription]
          );
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
