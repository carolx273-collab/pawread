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
model: ‘claude-opus-4-5’,
max_tokens: 500,
system: ‘Du bist der PawRead Hundeexperte - ein freundlicher Assistent der Hundebesitzern bei Fragen zur Hundekörpersprache hilft. Antworte immer auf Deutsch, kurz und praktisch (max 3-4 Saetze). Nutze gelegentlich Emojis. Weise bei ernsthaften Problemen auf einen Tierarzt hin. Beantworte NUR Fragen zu Hunden.’,
messages: [{ role: ‘user’, content: message }]
})
});

```
const data = await response.json();

if (data.error) {
  return res.status(500).json({ error: data.error.message });
}

const answer = data.content?.[0]?.text || 'Keine Antwort erhalten';
return res.status(200).json({ answer });
```

} catch (err) {
return res.status(500).json({ error: err.message });
}
}
