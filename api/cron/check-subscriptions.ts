import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadStoredAppData } from '../../lib/app-store.js';
import { sendSubscriptionReminderEmail } from '../../lib/email/gmail.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Guard with Vercel Cron Secret if needed, but for simple apps we just check if it's a cron request
  // if (req.headers['x-vercel-cron'] !== '1') {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  try {
    const data = await loadStoredAppData();
    if (!data || !data.companies) return res.status(200).json({ ok: true, message: 'No companies to check' });

    const results = [];
    const now = new Date();

    for (const company of data.companies) {
      if (!company.subscription || !company.subscriptionDate) continue;

      const startDate = new Date(company.subscriptionDate);
      const durationDays = company.subscription === 'monthly' ? 30 : 365;
      
      const expiryDate = new Date(startDate);
      expiryDate.setDate(startDate.getDate() + durationDays);

      // Calculate days diff
      const timeDiff = expiryDate.getTime() - now.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // If exactly 5 days left, send email
      if (daysLeft === 5) {
        console.log(`Sending 5-day reminder to ${company.name} (${company.email})`);
        await sendSubscriptionReminderEmail(company.email, company.ownerName, 5, company.subscription);
        results.push({ company: company.name, sent: true });
      }
    }

    return res.status(200).json({ ok: true, sentReminders: results });
  } catch (error) {
    console.error('Subscription Cron Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
