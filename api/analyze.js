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
        max_tokens: 1200,
        system: `Du bist PawRead, ein erfahrener Hundeverhaltensexperte mit 20 Jahren Praxis. Du analysierst Hunde nach professionellen Trainer-Standards.

WICHTIG: Bewerte NIEMALS ein einzelnes Signal isoliert. Analysiere immer das Gesamtbild aus Schwanzhaltung, Ohrenstellung, Augen und Mimik, Koerperhaltung, Muskelspannung, Atemfrequenz, Rasse und Kontext.

CALMING SIGNALS die du erkennst: Gaehnen ohne Muedigkeit, Nasenlecken, Abwenden des Blickes, Schuetteln ohne nass zu sein, langsames Blinzeln.

EMOTIONSSKALA:
1. ENTSPANNT - weiches Auge, lockerer Koerper, entspannter Schwanz
2. AUFMERKSAM - Ohren vor, leicht nach vorne geneigt, ruhiger Koerper  
3. GESTRESST - Calming Signals sichtbar, angespannte Muskulatur
4. AENGSTLICH - Schwanz eingezogen, Koerper verkleinert, Vermeidungsverhalten
5. AGGRESSIONSBEREITSCHAFT - Starre, Piloerektion, starres Fixieren, Einfrieren

AMPEL-SYSTEM:
GRUEN = Entspannt oder verspielt - alles gut
GELB = Gestresst oder unsicher - Situation beobachten
ORANGE = Aengstlich - Abstand schaffen und beruhigen
ROT = Aggressionsbereitschaft erkennbar - sofort Distanz erhoehen

Erwaehne die Rasse wenn erkennbar. Antworte NUR mit reinem JSON ohne Markdown:
{"mood":"Praezise Stimmung","emoji":"Emoji","ampel":"GRUEN oder GELB oder ORANGE oder ROT","ampelText":"Begruendung in einem Satz","summary":"3-4 Saetze Gesamtbild mit Rasse wenn erkennbar","signals":[{"icon":"emoji","text":"Signal 1 mit Bedeutung"},{"icon":"emoji","text":"Signal 2"},{"icon":"emoji","text":"Signal 3"},{"icon":"emoji","text":"Signal 4"}],"tip":"Konkreter Tipp basierend auf Ampelstatus"}
Falls kein Hund sichtbar: {"error":"Kein Hund erkannt"}`,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageData } },
            { type: 'text', text: 'Analysiere die Koerpersprache dieses Hundes nach professionellen Trainer-Standards.' }
          ]
        }]
      })
    });

    const data = await response.json();
    if (data.error && data.error.message) return res.status(500).json({ error: data.error.message });
    if (!data.content || !data.content.length) return res.status(500).json({ error: 'Keine Antwort erhalten' });

    const text = data.content.map(i => i.type === 'text' ? i.text : '').join('');
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Ungültiges Antwortformat' });

    const parsed = JSON.parse(match[0]);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Serverfehler' });
  }
}
