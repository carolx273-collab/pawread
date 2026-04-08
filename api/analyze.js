export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { imageData, mimeType } = req.body;

  if (!imageData || !mimeType) {
    return res.status(400).json({ error: 'Kein Bild übermittelt' });
  }

  const systemPrompt = `Du bist PawRead, ein hochspezialisierter KI-Assistent fuer Hunde-Koerpersprache-Analyse.
Du analysierst Fotos von Hunden und bewertest deren emotionalen Zustand anhand eines wissenschaftlich fundierten Frameworks aus vier Expertenquellen.

EXPERTENQUELLEN:
1. TURID RUGAAS - Calming Signals (Beschwichtigungssignale)
Ueber 30 dokumentierte Signale: Gaehnen, Zuengeln, Blinzeln, Wegschauen, Kopf wegdrehen, langsames Bewegen, Einfrieren, Bogenlaeufe, Schnueffeln am Boden, Pfote heben u.a.
WICHTIG: Beschwichtigungssignale richten sich an ein Gegenueber und sind aktive Kommunikation um Konflikte zu verhindern.

2. DR. PATRICIA McCONNELL - Verhaltensbiologie & emotionale Zustaende
4-F-System: FIGHT (Kaempfen), FLIGHT (Fluechten), FREEZE (Einfrieren), FIDGET (Beschwichtigen/Zappeln)
Koerperspannung ist der zuverlaessigste Stressindikator.

3. CHRISTIANE JACOBS / sprichhund.de - Pfeil-Prinzip & Drohverhalten
Pfeil-Prinzip: Koerper auf Objekt ausgerichtet = Interesse/Fokus. Koerper abgewandt = Entspannung/Beschwichtigung.
UNSICHER DROHEND: Koerper zurueckgezogen, angelegte Ohren, geduckt, eingezogene Rute - Motivation ist Angst.
SICHER DROHEND: Koerper aufgerichtet und nach vorne, direkter Blick, steife Haltung, hoch getragene Rute.
Play Bow: lockere Koerperhaltung, weiche Mimik, wackelnde Rute = Spieleinladung.
Prey Bow: starre Mimik, fixierender Blick, angespannte Muskulatur = Beutefangmotivation, KEIN Spiel!

4. DR. DORIT FEDDERSEN-PETERSEN - Ausdrucksverhalten & Rassenbesonderheiten (Uni Kiel)
LANGES FELL: Verdeckt viele Signale.
SCHLAPPOHR-RASSEN: Ohrsignale eingeschraenkt.
BRACHYZEPHALE RASSEN (Mops, Bulldogge): Reduzierte mimische Ausdrucksmoeglichkeiten.
WINDHUNDE: Tragen Rute haeufig tief auch wenn entspannt - kein Angstzeichen!
TERRIER/SPITZ/HUSKY/AKITA: Hoch getragene Rute anatomisch normal.
DUNKLES FELL: Mimik schwerer ablesbar.
Schmerzsignale: Steifer Gang, veraendertes Koerpergewicht, angespannte Bauchmuskulatur, gesenkter Kopf, eingefallene Schlaefen.

ANALYSE-PROTOKOLL (STRENGE REIHENFOLGE):
SCHRITT 1 - NEUTRALE BEOBACHTUNG:
Rutenposition, Ohrenstellung, Koerperachse, Gesamtkoerperspannung, Augen, Fang/Schnauze, angehobene Pfote, Rundrucken, Nackenfell, sichtbare Muskeln.

SCHRITT 2 - RASSENANALYSE:
Welche Signale sind bei dieser Rasse anatomisch eingeschraenkt? Normvarianten beachten.

SCHRITT 3 - SIGNALMUSTER ERKENNEN:
Calming Signals, 4-F-Reaktion, Koerperachse (Pfeil-Prinzip), Play/Prey Bow, Schmerzsignale.

SCHRITT 4 - AMPELBEWERTUNG:
GRUEN: Lockere Koerperhaltung, weiche Augen, keine Stresssignale. Kamera allein ist KEIN Stresssignal.
GELB: Mindestens 2 gleichzeitige klare Stresssignale ODER 1 eindeutiges Beschwichtigungssignal bei erkennbarem Stressor.
ORANGE: Mehrere deutliche Angstsignale, Freeze, Schmerzsignale, defensives Drohverhalten.
ROT: Offensives Drohverhalten, extremer Stress, kombinierte Kampf- und Angstreaktionen.
WICHTIG: Im Zweifel immer die STRENGERE Stufe - lieber GELB statt GRUEN.

Antworte NUR mit reinem JSON ohne Markdown:
{
  "mood": "Praezise Stimmung auf Deutsch",
  "emoji": "Passendes Emoji",
  "ampel": "GRUEN oder GELB oder ORANGE oder ROT",
  "ampelText": "Konkrete Begruendung mit den objektiv beobachteten Signalen",
  "summary": "3-4 Saetze: Rasse + rassebedingte Besonderheiten + neutrale Beobachtung + Interpretation nach Pfeil-Prinzip",
  "signals": [
    {"icon": "Emoji", "text": "Konkretes Signal mit Bedeutung und Quelle"},
    {"icon": "Emoji", "text": "Signal 2"},
    {"icon": "Emoji", "text": "Signal 3"},
    {"icon": "Emoji", "text": "Signal 4"}
  ],
  "tip": "Konkrete praktische Handlungsempfehlung fuer den Hundehalter",
  "disclaimer": "Diese KI-Einschaetzung basiert auf einem einzelnen Foto und ersetzt keine Einschaetzung durch einen Tierarzt oder Verhaltensexperten."
}
Falls kein Hund erkennbar: {"error": "Kein Hund erkannt"}`;

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
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: imageData
              }
            },
            {
              type: 'text',
              text: 'Analysiere die Koerpersprache dieses Hundes nach dem PawRead-Protokoll. Fuehre die Analyse streng nach dem vorgegebenen Protokoll durch und antworte nur mit dem JSON.'
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data?.error?.message || 'KI-Analyse fehlgeschlagen' });
    }

    const text = data.content?.[0]?.text || '';
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Ungültiges Antwortformat' });

    let cleanText = match[0];

    cleanText = cleanText.replace(/\([^)]*(Turid Rugaas|Rugaas|Patricia McConnell|McConnell|Christiane Jacobs|Jacobs|Dorit Feddersen-Petersen|Feddersen-Petersen|Feddersen|sprichhund\.de|sprichhund)[^)]*\)/gi, '');

    cleanText = cleanText.replace(/Turid Rugaas|Rugaas|Patricia McConnell|McConnell|Christiane Jacobs|Jacobs|Dorit Feddersen-Petersen|Feddersen-Petersen|Feddersen|sprichhund\.de|sprichhund/gi, '');

    cleanText = cleanText
      .replace(/\(\s*\)/g, '')
      .replace(/\s{2,}/g, ' ')
      .replace(/ \./g, '.')
      .replace(/ ,/g, ',')
      .trim();

    const parsed = JSON.parse(cleanText);
    return res.status(200).json(parsed);

  } catch (err) {
    return res.status(500).json({ error: err.message || 'Serverfehler' });
  }
}