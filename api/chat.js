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
PawRead Wissensbasis:

1. Grundprinzip
PawRead hilft dabei, die Körpersprache von Hunden besser zu verstehen.
Die Antworten dienen nur zur Orientierung und ersetzen keine tierärztliche oder verhaltenstherapeutische Einschätzung.

2. Wichtige Grundregeln
Man darf nie nur ein einzelnes Signal deuten.
Immer den gesamten Hund und die Situation betrachten.
Körpersprache ist Kontext.

3. Häufige Signale
Ohren nach hinten können auf Unsicherheit, Stress, Beschwichtigung oder Angst hindeuten.
Eine lockere Körperhaltung spricht meist für Entspannung.
Ein wedelnder Schwanz bedeutet nicht automatisch Freude. Auch Tempo, Höhe und Körperspannung sind wichtig.
Ein angespannter Körper kann auf Stress, Unsicherheit oder Konflikt hindeuten.
Blick abwenden, Gähnen, Schlecken über die Nase oder plötzliches Schnüffeln können Beschwichtigungssignale sein.

4. Ampel Logik
Grün bedeutet eher entspannt oder stabil.
Gelb bedeutet erhöhte Aufmerksamkeit, Unsicherheit oder beginnender Stress.
Orange bedeutet deutliche Angst, starke Unsicherheit oder Überforderung.
Rot bedeutet akute Eskalationsgefahr oder deutliches Drohverhalten. Dann Abstand schaffen und Situation entschärfen.

5. Wichtige Hinweise
PawRead stellt keine Diagnosen.
Bei Schmerzen, Atemnot, Krampfanfällen, Vergiftungsverdacht, Kollaps, starken Blutungen oder anderen Notfällen immer sofort einen Tierarzt kontaktieren.
Bei unklaren Fragen lieber kurz nachfragen als etwas erfinden.

6. Sprachstil
Antworte immer auf Deutsch.
Antworte ruhig, freundlich, klar und alltagstauglich.
Antworte meist in 3 bis 6 Sätzen.
Wenn jemand nur "Hallo", "Hi", "Test" oder ähnlich schreibt, antworte freundlich und frage, wobei du helfen kannst.
Keine unnötig komplizierte Fachsprache.
`;

    const systemPrompt = `
Du bist der PawRead Assistent, ein freundlicher und verständlicher Begleiter für Fragen zur Hundekörpersprache.

Deine Aufgaben:
- Du beantwortest Fragen zur Körpersprache von Hunden verständlich und ruhig.
- Du hilfst beim Einordnen von Signalen, ohne absolute Diagnosen zu behaupten.
- Du bleibst freundlich, klar und hilfreich.
- Wenn eine Frage zu unklar ist, frag kurz nach.
- Wenn nur ein Testwort kommt, begrüße freundlich und frage nach dem Anliegen.
- Bei möglichen Notfällen empfiehlst du sofort einen Tierarzt.

Nutze diese PawRead Wissensbasis als Leitlinie:
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
        max_tokens: 500,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: cleanMessage
          }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API Fehler:', JSON.stringify(data, null, 2));
      return res.status(response.status).json({
        error: data?.error?.message || 'Fehler bei der KI Anfrage'
      });
    }

    let answer = '';

    if (data && data.content && Array.isArray(data.content)) {
      answer = data.content
        .map(item => item?.text || '')
        .join('')
        .trim();
    }

    if (!answer) {
      console.error('Leere Antwort von Anthropic:', JSON.stringify(data, null, 2));
      answer = 'Hallo 🐾 Ich bin dein PawRead Assistent. Frag mich gern etwas zur Körpersprache deines Hundes, zum Beispiel zu Ohren, Rute, Haltung oder Stresssignalen.';
    }

    return res.status(200).json({ answer });
  } catch (error) {
    console.error('Serverfehler /api/chat:', error);
    return res.status(500).json({ error: 'Interner Serverfehler' });
  }
}