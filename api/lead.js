module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.CRM_TOKEN;
  if (!token) {
    console.error('CRM_TOKEN env var is not set');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const { name, phone, email, interested_in, purpose, budget } = req.body || {};
  if (!name || !phone || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const requirements = [
    interested_in && `Interested in: ${interested_in}`,
    purpose && `Purpose: ${purpose}`,
    budget && `Budget: ${budget}`,
  ].filter(Boolean).join(' | ');

  try {
    const resp = await fetch('https://studio.blackoak-re.com/api/v1/public/intake/leads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        phone,
        email,
        requirements,
        source: 'bashayer-landing',
      }),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.error('CRM error', resp.status, text);
      return res.status(502).json({ error: 'CRM rejected the lead' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('CRM fetch failed', err);
    return res.status(502).json({ error: 'CRM unreachable' });
  }
};
