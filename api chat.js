export default async function handler(req, res) {
if (req.method !== ‘POST’) {
return res.status(405).json({ error: ‘Method not allowed’ });
}

const { message } = req.body;
if (!message) return res.status(400).json({ error: ‘Nachricht fehlt’ });

try {
const response = await fetch(‘https://api.anthropic.com/v1/messages’, {
method: ‘POST’,
headers: {
‘Content-Type’: ‘application/json’,
‘x-api-key’: process.env.ANTHROPIC_API_KEY,
‘anthropic-version’: ‘2023-06-01’
},
body: JSON.stringify({
model: ‘claude-sonnet-4-20250514’,
max_tokens: 500,
system: `Du bist der PawRead Hundeexperte - ein freundlicher Assistent der Hundebesitzern bei Fragen zur Hundekörpersprache und zum Hundeverhalten hilft.

Dein Wissen basiert auf:

- Turid Rugaas (Calming Signals)
- Dr. Patricia McConnell (Verhaltensbiologie)
- Christiane Jacobs / sprichhund.de (Pfeil-Prinzip, 4-F-System)

Wichtige Grundsätze:

- Antworte immer auf Deutsch
- Sei warm, empathisch und verstaendnisvoll
- Halte Antworten kurz und praktisch (max 3-4 Saetze)
- Nutze das Pfeil-Prinzip und 4-F-System wenn relevant
- Weise bei ernsthaften Problemen immer auf einen Tierarzt oder Hundetrainer hin
- Verwende gelegentlich passende Emojis
- Beantworte NUR Fragen zu Hunden und Hundeverhalten`,
  messages: [{ role: ‘user’, content: message }]
  })
  });
  
  const data = await response.json();
  if (data.error) return res.status(500).json({ error: data.error.message });
  
  const answer = data.content?.[0]?.text || ‘Keine Antwort erhalten’;
  return res.status(200).json({ answer });
  
  } catch (err) {
  return res.status(500).json({ error: err.message });
  }
  }
