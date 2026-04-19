export default async function handler(req, res) {
if (req.method !== “POST”) {
return res.status(405).json({ error: “Method not allowed” });
}

const { image: imageField, imageData, breed, situation } = req.body;
const image = imageField || imageData;

if (!image) {
return res.status(400).json({ error: “Kein Bild übermittelt” });
}

const breedContext = breed
? `Der Hund auf dem Foto ist ein ${breed}.`
: “Die Rasse ist nicht bekannt.”;

const situationContext = situation
? `KONTEXT DER SITUATION: ${situation}`
: “KONTEXT DER SITUATION: Nicht angegeben.”;

const systemPrompt = `Du bist PawRead, ein hochspezialisierter KI-Assistent für Hunde-Körpersprache-Analyse.
Du analysierst Fotos von Hunden und bewertest deren emotionalen Zustand anhand eines wissenschaftlich fundierten Frameworks aus vier Expertenquellen.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
KONTEXT-WARNUNG – KRITISCH FÜR KORREKTE ANALYSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FREEZE-FALLE: Ein Foto zeigt nur einen einzigen eingefrorenen Moment. Hunde die innerlich PANISCH sind können auf einem Foto täuschend entspannt oder reglos wirken – das ist das Freeze-Phänomen. Besonders in Stresssituationen (Tierarzt, fremde Umgebung, Lärm, Menschenmassen) MUSS die Ampel im Zweifel STRENGER bewertet werden, nicht milder.

KONTEXTBASIERTE STRESSVERSTÄRKUNG:
• Tierarzt / Tierklinik → Grundstress sehr hoch, Freeze-Wahrscheinlichkeit extrem erhöht → MINDESTENS GELB, oft ORANGE
• Fremde Umgebung / unterwegs → Grundstress erhöht → Ampel eine Stufe strenger
• Feuerwerk / laute Geräusche → Extremstress möglich trotz regloser Pose → MINDESTENS ORANGE
• Zuhause / vertraute Umgebung → Normale Bewertung möglich
• Spiel / Freilauf → Positive Erregung möglich, lockere Signale ok

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
EXPERTENQUELLEN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. TURID RUGAAS – Calming Signals
1. DR. PATRICIA McCONNELL – 4-F-System (Fight/Flight/Freeze/Fawn)
1. CHRISTIANE JACOBS / sprichhund.de – Pfeil-Prinzip & Drohverhalten
1. DR. DORIT FEDDERSEN-PETERSEN – Ausdrucksverhalten & Rassenbesonderheiten

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AMPELBEWERTUNG
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GRUEN – Entspannt & wohl: Lockere Körperhaltung, weiche Augen, keine Stresssignale. NUR in vertrauter ruhiger Umgebung.
GELB – Leicht angespannt: Mindestens 2 Stresssignale ODER Stresssituation bekannt aber keine klaren Signale sichtbar (Freeze möglich).
ORANGE – Deutlicher Stress: Mehrere Angstsignale, Freeze in Stresssituation sehr wahrscheinlich, Schmerzsignale, defensives Drohverhalten.
ROT – Hohes Stressniveau: Offensives Drohverhalten, Extremstress mit mehreren Hochstress-Signalen.

WICHTIGE REGEL: Im Zweifel IMMER die STRENGERE Stufe wählen!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AUSGABEFORMAT – NUR REINES JSON, KEIN TEXT DAVOR ODER DANACH
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Antworte AUSSCHLIESSLICH mit einem JSON-Objekt in exakt diesem Format:

{
“ampel”: “GRUEN”,
“mood”: “Dein Hund wirkt entspannt und wohl.”,
“beobachtung”: “2-3 Sätze: Was siehst du konkret? Körperhaltung, Augen, Rute, Ohren usw.”,
“bedeutung”: “2-3 Sätze: Was bedeutet das? Welche Emotion steckt dahinter?”,
“signals”: [
{ “icon”: “😌”, “text”: “Kurze, konkrete Beobachtung 1” },
{ “icon”: “🐾”, “text”: “Kurze, konkrete Beobachtung 2” },
{ “icon”: “💚”, “text”: “Kurze, konkrete Beobachtung 3” }
],
“freeze_hinweis”: “Nur ausfüllen wenn Freeze-Verdacht besteht, sonst leerer String”,
“rassen_hinweis”: “Nur ausfüllen wenn rassenbedingte Einschränkungen relevant sind, sonst leerer String”,
“tipp”: “1-2 konkrete, praktische Handlungsempfehlungen für den Halter.”,
“expertenwissen”: “Kurzer Hinweis welche Expertenmethode die Analyse hauptsächlich gestützt hat.”
}

WICHTIGE JSON-REGELN:

- ampel ist IMMER eines von: GRUEN, GELB, ORANGE, ROT
- signals enthält IMMER 3 Einträge mit jeweils icon und text
- text in signals ist IMMER eine kurze eigenständige Beobachtung (nicht der gleiche Text wie beobachtung!)
- Kein Markdown, keine Codeblöcke, nur reines JSON`;
  
  try {
  const response = await fetch(“https://api.anthropic.com/v1/messages”, {
  method: “POST”,
  headers: {
  “Content-Type”: “application/json”,
  “x-api-key”: process.env.ANTHROPIC_API_KEY,
  “anthropic-version”: “2023-06-01”,
  },
  body: JSON.stringify({
  model: “claude-sonnet-4-5-20250929”,
  max_tokens: 1024,
  system: systemPrompt,
  messages: [
  {
  role: “user”,
  content: [
  {
  type: “image”,
  source: {
  type: “base64”,
  media_type: image.startsWith(“data:image/png”)
  ? “image/png”
  : image.startsWith(“data:image/webp”)
  ? “image/webp”
  : “image/jpeg”,
  data: image.replace(/^data:image/\w+;base64,/, “”),
  },
  },
  {
  type: “text”,
  text: `Analysiere die Körpersprache dieses Hundes. ${breedContext} ${situationContext} Antworte NUR mit dem JSON-Objekt, kein Text davor oder danach.`,
  },
  ],
  },
  ],
  }),
  });
  
  if (!response.ok) {
  const error = await response.json();
  console.error(“Anthropic API error:”, error);
  return res.status(500).json({ error: “KI-Analyse fehlgeschlagen”, details: error });
  }
  
  const data = await response.json();
  const rawText = (data.content[0]?.text || “”).trim();
  
  // JSON parsen – Codeblöcke entfernen falls vorhanden
  let parsed;
  try {
  const clean = rawText.replace(/^`json\s*/i, "").replace(/^`\s*/i, “”).replace(/```\s*$/i, “”).trim();
  parsed = JSON.parse(clean);
  } catch (e) {
  console.error(“JSON parse error:”, e, “Raw:”, rawText);
  return res.status(500).json({ error: “Analyse konnte nicht verarbeitet werden. Bitte erneut versuchen.” });
  }
  
  // Ampel normalisieren
  const ampelRaw = (parsed.ampel || “GRUEN”).toUpperCase().replace(“Ü”, “U”);
  const ampel = [“GRUEN”, “GELB”, “ORANGE”, “ROT”].includes(ampelRaw) ? ampelRaw : “GRUEN”;
  
  const ampelEmojis = { GRUEN: “😊”, GELB: “😐”, ORANGE: “😟”, ROT: “😨” };
  const ampelTexts = {
  GRUEN: “Dein Hund wirkt entspannt und wohl.”,
  GELB: “Dein Hund ist leicht angespannt – beobachte ihn.”,
  ORANGE: “Dein Hund zeigt deutlichen Stress oder Angst.”,
  ROT: “Dein Hund zeigt starken Stress oder Drohverhalten.”,
  };
  
  // Signals sicherstellen
  const signals = Array.isArray(parsed.signals) && parsed.signals.length > 0
  ? parsed.signals.slice(0, 4).map(s => ({
  icon: s.icon || “🐾”,
  text: s.text || “”
  }))
  : [{ icon: “🐾”, text: “Keine spezifischen Signale erkennbar.” }];
  
  // ampelText: Freeze-Hinweis bevorzugt, sonst Standard
  const ampelText = parsed.freeze_hinweis || ampelTexts[ampel];
  
  // summary = beobachtung + bedeutung (getrennt, nicht doppelt)
  const summary = [parsed.beobachtung, parsed.bedeutung]
  .filter(Boolean)
  .join(” “)
  .trim();
  
  // Tipp zusammenbauen
  let tip = parsed.tipp || “Beobachte deinen Hund aufmerksam und vertraue deinem Bauchgefühl.”;
  if (parsed.rassen_hinweis) tip += “ “ + parsed.rassen_hinweis;
  if (parsed.expertenwissen) tip += “\n\n📚 “ + parsed.expertenwissen;
  
  return res.status(200).json({
  mood: parsed.mood || ampelTexts[ampel],
  emoji: ampelEmojis[ampel],
  ampel,
  ampelText,
  summary,
  signals,
  tip,
  disclaimer: “KI-Analyse – kein Ersatz für Tierarzt oder Verhaltensexperten.”,
  });
  
  } catch (err) {
  console.error(“Server error:”, err);
  return res.status(500).json({ error: “Serverfehler”, details: err.message });
  }
  }