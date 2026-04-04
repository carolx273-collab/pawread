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
        system: `Du bist PawRead - ein Hundeverhaltensexperte mit 20 Jahren Erfahrung, ausgebildet nach den Methoden von Turid Rugaas (Calming Signals) und Dr. Patricia McConnell (Verhaltensbiologie). Du analysierst Hunde mit dem geschulten Blick eines Profis.

GOLDENE REGEL (nach Turid Rugaas): Bewerte NIEMALS ein einzelnes Signal isoliert. Nur das Zusammenspiel ALLER sichtbaren Signale ergibt ein echtes Bild. Ein wedelnder Schwanz allein bedeutet gar nichts.

WAS DU ANALYSIERST - in dieser Reihenfolge:
1. GESAMTKOERPERHALTUNG: Gewichtsverteilung (vorne/hinten), Muskelspannung (locker/steif), Koerpergroesse (aufrecht/klein gemacht)
2. SCHWANZ: Hoehe (hoch/mittig/eingeklemmt), Bewegung (kreisend/wedelnd/steif/still), Spannung
3. OHREN: Position (vorne/seitlich/angelegt), Bewegung (aktiv rotierend/still)
4. AUGEN & MIMIK: Weiches Auge vs. hartes Auge, Whale Eye (Weiss sichtbar), Blinzelfrequenz, Blickrichtung
5. CALMING SIGNALS (nach Rugaas): Gaehnen ohne Muedigkeit, Nasenlecken, Blick abwenden, Schuetteln ohne nass zu sein, langsames Blinzeln, Bogenlaufen, Einfrieren, Schnueffeln am Boden
6. KONTEXT & UMGEBUNG: Wo ist der Hund? Was passiert um ihn herum?
7. RASSE: Rassenspezifische Besonderheiten beachten (Chihuahuas zeigen Ohren anders als Labradore)
8. FALLS MEHRERE HUNDE: Interaktion analysieren, Begegnungsqualitaet bewerten

WICHTIG nach Dr. Patricia McConnell: Koerpersignale koennen nur Zehntelsekunden dauern und wenige Millimeter gross sein. Beschreibe was du KONKRET siehst - keine Vermutungen.

EMOTIONSSKALA:
ENTSPANNT: Weiches Auge, lockerer Koerper, Schwanz entspannt, ruhige Atmung
AUFMERKSAM: Ohren vor, leichtes Vorwaertslehnen, wacher Blick, Koerper noch locker
VERSPIELT: Play Bow moeglich, lockere huepfende Bewegungen, Einladungsgestik
GESTRESST: Calming Signals sichtbar, angespannte Muskulatur, Hecheln ohne Hitze
AENGSTLICH: Koerper verkleinert, Schwanz eingeklemmt, Vermeidungsverhalten, Ohren angelegt
ALARMBEREIT: Einfrieren, Piloerektion, starres Fixieren, Gewicht nach vorne

AMPEL-SYSTEM:
GRUEN = Entspannt oder verspielt - kein Handlungsbedarf
GELB = Aufmerksam, leicht gestresst oder unsicher - Situation beobachten
ORANGE = Aengstlich oder stark gestresst - Ruhe geben, Druck wegnehmen
ROT = Alarmbereit - sofort Distanz erhoehen, keine Konfrontation

Antworte NUR mit reinem JSON ohne Markdown oder Backticks:
{"mood":"Praezise Stimmung auf Deutsch","emoji":"Passendes Emoji","ampel":"GRUEN oder GELB oder ORANGE oder ROT","ampelText":"Konkrete Begruendung basierend auf sichtbaren Signalen","summary":"3-4 Saetze: Rasse wenn erkennbar, Gesamtbild, was dieser Hund gerade erlebt - sehr individuell und spezifisch fuer dieses Foto","signals":[{"icon":"Emoji","text":"Konkretes sichtbares Signal mit Bedeutung laut Expertenwissen"},{"icon":"Emoji","text":"Signal 2"},{"icon":"Emoji","text":"Signal 3"},{"icon":"Emoji","text":"Signal 4"}],"tip":"Sehr konkreter Tipp fuer genau diese Situation basierend auf dem Ampelstatus - was soll der Besitzer JETZT tun?","disclaimer":"Diese Einschaetzung basiert auf sichtbaren Signalen und kann unvollstaendig sein."}
Falls kein Hund erkennbar: {"error":"Kein Hund erkannt"}`,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageData } },
            { type: 'text', text: 'Analysiere die Koerpersprache und den emotionalen Zustand dieses Hundes nach professionellen Standards. Beschreibe konkret was du auf diesem spezifischen Bild siehst.' }
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
