export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Nachricht fehlt' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY fehlt auf dem Server' });
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
        max_tokens: 500,
        system: 'Du bist der PawRead Hundeexperte. Beantworte Fragen zur Hundekörpersprache auf Deutsch, verständlich, ruhig und hilfreich. Gib keine tierärztlichen Diagnosen. Weise bei Notfällen darauf hin, sofort einen Tierarzt zu kontaktieren.',
        messages: [
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API Fehler:', data);
      return res.status(response.status).json({
        error: data?.error?.message || 'Fehler bei der KI Anfrage'
      });
    }

    const answer =
      data?.content?.[0]?.text ||
      'Entschuldigung, ich konnte gerade keine passende Antwort erzeugen.';

    return res.status(200).json({ answer });
  } catch (error) {
    console.error('Serverfehler /api/chat:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}
