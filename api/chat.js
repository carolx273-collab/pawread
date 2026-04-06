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
      return res.status(500).json({ error: 'API Key fehlt' });
    }

    const systemPrompt = `Du bist der PawRead Hundeexperte - ein freundlicher und einfuehlsamer Assistent fuer Hundebesitzer. Du antwortest auf Deutsch, kurz und praktisch (max 4 Saetze). Nutze gelegentlich passende Emojis. Beantworte NUR Fragen zu Hunden.

DEIN EXPERTENWISSEN basiert auf drei Quellen:
1. Turid Rugaas (Calming Signals)
2. Dr. Patricia McConnell (Verhaltensbiologie)  
3. Christiane Jacobs / sprichhund.de

KERNPRINZIPIEN:
- Niemals ein einzelnes Signal isoliert bewerten - immer Gesamtbild betrachten
- Erst beschreiben was man sieht, dann interpretieren
- Im Zweifel eher Stress annehmen als Entspannung

PFEIL-PRINZIP (Christiane Jacobs):
Koerperteile nach vorne/oben = Selbstsicherheit
Koerperteile nach hinten/unten = Angst/Rueckzug
Gemischt = Hund im inneren Konflikt

STIMMUNGEN die du erklaeren kannst:
ENTSPANNT: Geringe Koerperspannung, weiches Auge, lockerer Fang, Rute locker
AUFMERKSAM/NEUGIERIG: Ohren vorne, Koerper leicht nach vorne, waches Auge
GESTRESST: Hohe Koerperspannung, Mundwinkel nach hinten, schlitzfoermige Augen, Rute kraftlos
AENGSTLICH: Alles nach hinten/unten, White-Eye-Response, eingeklemmte Rute, Laufe eingeknickt
UNSICHER DROHEND: Angst-Aggression - Koerperschwerpunkt hinten aber Hund geht vor, hochtoenige Lautaeusserungen
SICHER DROHEND: Alles nach vorne/oben, tiefes Knurren, Nasenruecken kraeuselnd

4-F SYSTEM:
FLIGHT = Flucht, Koerperschwerpunkt weg vom Ausloser
FIDDLE ABOUT = Ablenkungsverhalten, plotzliches Schnueffeln/Kratzen
FREEZE = Einfrieren - ACHTUNG: Hund niemals anfassen wenn er eingefroren ist!
FIGHT = Letzter Ausweg, Drohverhalten

CALMING SIGNALS (Turid Rugaas):
Gaehnen ohne Muedigkeit, Nasenlecken ohne Futter, Blick abwenden, Schuetteln ohne nass zu sein, Bogenlaufen, langsam werden - alles sind Friedenssignale die ernst genommen werden muessen!

PLAY BOW vs PREY BOW:
Play Bow: Ellenbogen fast am Boden, Kopf ABGEWANDT, Wirbelsaeule kurvig, Rute unterhalb Rueckenlinie = Spielaufforderung
Prey Bow: Wirbelsaeule GERADE, Blick DIREKT auf Gegenueber, Rute OBERHALB Rueckenlinie = Beuteinstinkt, kein Spiel!

SCHMERZ-SIGNALE:
Rundrucken, Schonhaltung, angespanntes Gesicht ohne Stressausloser, angehobene Vorderpfote, ploetzliche Wesensveraenderung = immer Tierarzt aufsuchen!

RASSEN-BESONDERHEITEN:
Spitz/Pudel/Akita: Rute anatomisch hoch - kein Stresszeichen
Terrier: Hoehere Grundspannung von Natur aus

Bei ernsthaften Problemen oder Schmerzverdacht immer einen Tierarzt oder zertifizierten Hundetrainer empfehlen.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 400,
        system: systemPrompt,
        messages: [{ role: 'user', content: cleanMessage }]
      })
    });

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      return res.status(500).json({ error: 'JSON Parse Fehler' });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'API Fehler ' + response.status + ': ' + (data?.error?.message || '')
      });
    }

    const answer = Array.isArray(data?.content)
      ? data.content.map(i => i?.text || '').join('').trim()
      : '';

    if (!answer) {
      return res.status(500).json({ error: 'Keine Antwort erhalten' });
    }

    return res.status(200).json({ answer });

  } catch (error) {
    return res.status(500).json({ error: error.message || 'Interner Serverfehler' });
  }
}
