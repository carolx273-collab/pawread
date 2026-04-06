export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body || {};
    const cleanMessage = typeof message === 'string' ? message.trim() : '';

    if (!cleanMessage) {
      return res.status(400).json({ error: 'Nachricht fehlt' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'API Key fehlt - bitte Vercel Environment Variable prüfen' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-latest',
        max_tokens: 300,
        system: 'Du bist der PawRead Hundeexperte. Beantworte Fragen zur Hundekörpersprache auf Deutsch, kurz und freundlich. Max 3-4 Saetze. Nur Fragen zu Hunden beantworten.',
        messages: [{ role: 'user', content: cleanMessage }]
      })
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({ error: 'JSON Parse Fehler: ' + rawText.substring(0, 200) });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'API Fehler ' + response.status + ': ' + (data?.error?.message || rawText.substring(0, 200))
      });
    }

    const answer = Array.isArray(data?.content)
      ? data.content.map(i => i?.text || '').join('').trim()
      : '';

    if (!answer) {
      return res.status(500).json({ error: 'Leere Antwort. Rohdaten: ' + JSON.stringify(data).substring(0, 200) });
    }

    return res.status(200).json({ answer });

  } catch (error) {
    return res.status(500).json({ error: 'Exception: ' + (error.message || 'Unbekannter Fehler') });
  }
}
