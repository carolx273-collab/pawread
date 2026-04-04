export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageData, mimeType } = req.body;

  if (!imageData || !mimeType) {
    return res.status(400).json({ error: 'Bild fehlt' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `Du bist PawRead, Experte fuer Hundekörpersprache. Analysiere das Foto und antworte NUR mit reinem JSON ohne Markdown:
{"mood":"Stimmung auf Deutsch","emoji":"Emoji","summary":"2-3 Saetze Beschreibung","signals":[{"icon":"emoji","text":"Signal 1"},{"icon":"emoji","text":"Signal 2"},{"icon":"emoji","text":"Signal 3"}],"tip":"Tipp fuer Besitzer"}
Falls kein Hund sichtbar: {"error":"Kein Hund erkannt"}`,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType, data: imageData }
            },
            { type: 'text', text: 'Analysiere die Körpersprache dieses Hundes.' }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const text = data.content.map(i => i.type === 'text' ? i.text : '').join('');
    const match = text.match(/\{[\s\S]*\}/);

    if (!match) {
      return res.status(500).json({ error: 'Ungültiges Antwortformat' });
    }

    const parsed = JSON.parse(match[0]);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Serverfehler' });
  }
}
