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
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY fehlt auf dem Server' });
    }

    const knowledgeBase = `
PawRead hilft beim Verstehen von Hundekörpersprache.
Nie nur ein einzelnes Signal deuten, sondern immer den Gesamtkontext betrachten.
Ohren nach hinten können Unsicherheit, Stress oder Angst bedeuten.
Eine lockere Körperhaltung spricht eher für Entspannung.
Wedeln bedeutet nicht automatisch Freude.
Blick abwenden, Gähnen, Nasenlecken oder plötzliches Schnüffeln können Beschwichtigungssignale sein.
Bei Notfällen wie Atemnot, Krampfanfällen, Vergiftungsverdacht, Kollaps oder starken Blutungen immer sofort zum Tierarzt.
`;

    const systemPrompt = `
Du bist der PawRead Assistent.
Antworte auf Deutsch, freundlich, ruhig und verständlich.
Antworte kurz und hilfreich.
Wenn nur "Hallo" oder "Test" kommt, begrüße freundlich und frage nach dem Anliegen.
Nutze diese Wissensbasis:
${knowledgeBase}
`;

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
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: cleanMessage
          }
        ]
      })
    });

    const rawText = await response.text();
    console.log('Anthropic raw status:', response.status);
    console.log('Anthropic raw body:', rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error('JSON Parse Fehler:', parseError);
      return res.status(500).json({
        error: 'Antwort der KI konnte nicht gelesen werden'
      });
    }

    if (!response.ok) {
      console.error('Anthropic API Fehler:', JSON.stringify(data, null, 2));
      return res.status(response.status).json({
        error: data?.error?.message || 'Fehler bei der KI Anfrage'
      });
    }

    let answer = '';

    if (Array.isArray(data?.content)) {
      answer = data.content
        .map(item => item?.text || '')
        .join('')
        .trim();
    }

    if (!answer) {
      console.error('Leere Antwort von Anthropic:', JSON.stringify(data, null, 2));
      return res.status(500).json({
        error: 'Die KI hat keine Textantwort geliefert'
      });
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error('Serverfehler /api/chat:', error);
    return res.status(500).json({ error: error.message || 'Interner Serverfehler' });
  }
}