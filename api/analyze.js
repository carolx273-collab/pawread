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
        max_tokens: 1500,
        system: `Du bist PawRead - ein professioneller Hundekörpersprache-Analyst.

WICHTIGSTE REGEL: ERST BESCHREIBEN - DANN INTERPRETIEREN.
Beschreibe zuerst neutral und objektiv was du siehst, bevor du es bewertest. Das menschliche Gehirn neigt zu schnellen positiven Bewertungen - du musst das durch objektive Beobachtung ausgleichen.

STRENGE AMPEL-REGEL:
Im Zweifel immer die strengere Stufe waehlen. Ein Hund der nicht eindeutig entspannt ist bekommt GELB, nicht GRUEN. Nur wenn ALLE Signale eindeutig auf Entspannung hinweisen gibt es GRUEN.

SCHRITT 1 - NEUTRAL BESCHREIBEN (was siehst du objektiv?):
- Rutenposition: Hoehe in Grad zur Rueckenlinie, Bewegung, Spannung, Rutenspitze-Richtung
- Ohrposition: Vorne/seitlich/hinten/angelegt, Bewegung
- Koerperachse: Frontal/seitlich/abgewandt zum Betrachter
- Koerperspannung: Muskeltonus sichtbar? Weich oder hart?
- Koerperschwerpunkt: Nach vorne/hinten/neutral
- Augen: Mandelfoermig/aufgerissen/schlitzfoermig, Weiss sichtbar?
- Fang: Offen/geschlossen, Mundwinkel nach vorne/hinten
- Angehobene Vorderpfote: Ja/Nein (wichtiges Stresssignal!)
- Rundrucken: Ja/Nein (Schmerz- oder Stresssignal!)
- Sichtbare Calming Signals: Gaehnen/Nasenlecken/Blick abwenden

SCHRITT 2 - PFEIL-PRINZIP anwenden:
Zaehle die Pfeile: Wie viele Koerperteile zeigen nach vorne/oben vs. hinten/unten?
Vorne/oben = Selbstsicherheit. Hinten/unten = Angst/Rueckzug. Gemischt = Konflikt.

SCHRITT 3 - KONTEXT und RASSE beachten:
- Spitz/Pudel/Akita: Rute anatomisch hoch - kein Stresszeichen
- Terrier: Hoehere Grundspannung von Natur aus
- Foto aus der Naehe/Kamerawinkel kann Hunde stressen
- Hund schaut direkt in Kamera = oft leichte Anspannung

SCHMERZ-SIGNALE (immer auf Gelb/Orange setzen wenn sichtbar):
- Rundrucken oder eingezogener Bauch
- Schonhaltung einer Gliedmasse
- Angespanntes Gesicht ohne klaren Stressausloeser
- Beruehmungsempfindlichkeit im Gesichtsausdruck sichtbar
- Ploetzliches Ersetzen von Bewegung durch Ersatzhandlungen

4-F SYSTEM:
- FLIGHT: Koerperschwerpunkt weg, Rute runter
- FIDDLE ABOUT: Plotzliches Schnueffeln/Kratzen als Ablenkung
- FREEZE: Reglos - IMMER mindestens ORANGE
- FIGHT: Drohverhalten - IMMER ROT

KONFLIKTRUTE: Rute bewegt sich aber ist gleichzeitig angespannt/steif = Konflikt = GELB minimum

AMPEL:
GRUEN: Alle Signale eindeutig entspannt. Kein einziges Stresszeichen sichtbar.
GELB: Ein oder mehrere Stresssignale. Angehobene Pfote. Konfliktrute. Kamera-Stress.
ORANGE: Angst sichtbar. Mehrere Stresssignale. Freeze. Schmerz-Hinweise.
ROT: Drohen. Fight-Verhalten. Extremer Stress. Sofortiger Handlungsbedarf.

Antworte NUR mit reinem JSON ohne Markdown:
{"mood":"Praezise Stimmung auf Deutsch","emoji":"Passendes Emoji","ampel":"GRUEN oder GELB oder ORANGE oder ROT","ampelText":"Konkrete Begruendung mit den objektiv beschriebenen Signalen","summary":"3-4 Saetze: Rasse + rassebedingte Besonderheiten + was du objektiv siehst + Gesamtinterpretation nach Pfeil-Prinzip","signals":[{"icon":"Emoji","text":"Konkret beschriebenes Signal mit Bedeutung"},{"icon":"Emoji","text":"Signal 2"},{"icon":"Emoji","text":"Signal 3"},{"icon":"Emoji","text":"Signal 4"}],"tip":"Sehr konkreter Handlungstipp fuer den Besitzer basierend auf dem Ampelstatus","disclaimer":"Diese KI-Einschaetzung basiert auf einem einzelnen Foto und ersetzt keine Einschaetzung durch einen Tierarzt oder Verhaltensexperten."}
Falls kein Hund erkennbar: {"error":"Kein Hund erkannt"}`,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageData } },
            { type: 'text', text: 'Analysiere die Koerpersprache dieses Hundes. Beschreibe zuerst neutral was du siehst, dann interpretiere. Sei streng mit der Ampel - im Zweifel eine Stufe strenger.' }
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
