/**
 * Kontaktformular – serverseitiger Versand über Resend
 * --------------------------------------------------------------------------
 * Läuft als Serverless Function bei Vercel unter /api/contact.
 *
 * Der API-Schlüssel steht AUSSCHLIESSLICH in den Umgebungsvariablen von
 * Vercel und erreicht den Browser des Besuchers nie.
 *
 * Benötigte Umgebungsvariablen (Vercel → Settings → Environment Variables):
 *   RESEND_API_KEY   erforderlich – der Schlüssel aus dem Resend-Konto
 *   CONTACT_TO       optional – Empfängeradresse
 *   CONTACT_FROM     optional – Absenderadresse
 */

const EMPFAENGER = process.env.CONTACT_TO || 'lebenshelper@gmail.com';

// Ohne verifizierte Domain erlaubt Resend nur diesen Absender. Sobald die
// Domain in Resend verifiziert ist, kann CONTACT_FROM z. B. auf
// "LebensHelper <kontakt@alltagsbegleitunglebenshelper.com>" gesetzt werden.
const ABSENDER = process.env.CONTACT_FROM || 'LebensHelper <onboarding@resend.dev>';

const MAX = { name: 120, phone: 60, email: 160, city: 120, message: 3000 };

/* Einfache Bremse gegen Massenversand. Der Speicher einer Serverless
   Function lebt nur kurz, das hält also keinen entschlossenen Angreifer auf –
   es genügt aber gegen einfache Bots, zusammen mit dem Honeypot unten. */
const letzteAnfragen = new Map();
const FENSTER_MS = 60 * 1000;
const MAX_PRO_FENSTER = 3;

function zuHaeufig(ip) {
  const jetzt = Date.now();
  const bisher = (letzteAnfragen.get(ip) || []).filter(t => jetzt - t < FENSTER_MS);
  bisher.push(jetzt);
  letzteAnfragen.set(ip, bisher);
  if (letzteAnfragen.size > 500) letzteAnfragen.clear(); // Speicher begrenzen
  return bisher.length > MAX_PRO_FENSTER;
}

function text(wert, grenze) {
  if (typeof wert !== 'string') return '';
  return wert.trim().slice(0, grenze);
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, fehler: 'Methode nicht erlaubt' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY fehlt in den Umgebungsvariablen');
    return res.status(503).json({ ok: false, fehler: 'Versand derzeit nicht verfügbar' });
  }

  const ip =
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unbekannt';
  if (zuHaeufig(ip)) {
    return res.status(429).json({
      ok: false,
      fehler: 'Zu viele Anfragen. Bitte versuchen Sie es in einer Minute erneut.'
    });
  }

  const body = typeof req.body === 'string' ? safeParse(req.body) : req.body || {};

  // Honeypot: ein für Menschen unsichtbares Feld. Ist es ausgefüllt, war es
  // ein Bot. Wir antworten trotzdem mit Erfolg, damit er nichts dazulernt.
  if (text(body.website, 100)) {
    return res.status(200).json({ ok: true });
  }

  const name = text(body.name, MAX.name);
  const telefon = text(body.phone, MAX.phone);
  const email = text(body.email, MAX.email);
  const ort = text(body.city, MAX.city);
  const pflegegrad = text(body.pflegegrad, 80);
  const nachricht = text(body.message, MAX.message);
  const leistungen = Array.isArray(body.services)
    ? body.services.slice(0, 20).map(s => text(s, 80)).filter(Boolean)
    : [];

  if (!name || !telefon || !ort) {
    return res.status(400).json({
      ok: false,
      fehler: 'Bitte Name, Telefonnummer und Wohnort angeben.'
    });
  }

  const antwortAdresse = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;

  const zeilen = [
    'Neue Anfrage über alltagsbegleitunglebenshelper.com',
    '',
    `Name:          ${name}`,
    `Telefon:       ${telefon}`,
    `E-Mail:        ${email || '–'}`,
    `PLZ / Wohnort: ${ort}`,
    `Pflegegrad:    ${pflegegrad || '–'}`,
    '',
    'Gewünschte Unterstützung:',
    leistungen.length ? leistungen.map(s => `  - ${s}`).join('\n') : '  (keine Auswahl)',
    '',
    'Nachricht:',
    nachricht || '–'
  ];

  const html = `
    <div style="font-family:system-ui,-apple-system,'Segoe UI',sans-serif;color:#16303E;line-height:1.6">
      <h2 style="color:#1F5C7E;margin:0 0 16px">Neue Anfrage über die Website</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><strong>Name</strong></td><td>${escapeHtml(name)}</td></tr>
        <tr><td><strong>Telefon</strong></td><td><a href="tel:${escapeHtml(telefon)}">${escapeHtml(telefon)}</a></td></tr>
        <tr><td><strong>E-Mail</strong></td><td>${email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : '–'}</td></tr>
        <tr><td><strong>PLZ / Wohnort</strong></td><td>${escapeHtml(ort)}</td></tr>
        <tr><td><strong>Pflegegrad</strong></td><td>${escapeHtml(pflegegrad) || '–'}</td></tr>
      </table>
      <p style="margin:16px 0 4px"><strong>Gewünschte Unterstützung</strong></p>
      ${leistungen.length
        ? `<ul>${leistungen.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>`
        : '<p>(keine Auswahl)</p>'}
      <p style="margin:16px 0 4px"><strong>Nachricht</strong></p>
      <p style="white-space:pre-wrap">${escapeHtml(nachricht) || '–'}</p>
    </div>`;

  try {
    const antwort = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: ABSENDER,
        to: [EMPFAENGER],
        subject: `Anfrage Erstberatung – ${name}`,
        text: zeilen.join('\n'),
        html,
        ...(antwortAdresse ? { reply_to: antwortAdresse } : {})
      })
    });

    if (!antwort.ok) {
      const rohtext = await antwort.text();
      console.error('Resend-Fehler', antwort.status, rohtext);

      // Kurzdiagnose nur auf ausdrückliche Anforderung (?diag=1).
      // Enthält nie den API-Schlüssel – nur Statuscode und Fehlername von
      // Resend. Nach der Inbetriebnahme kann dieser Block entfernt werden.
      if (req.query && req.query.diag === '1') {
        let name = null, meldung = null;
        try { const j = JSON.parse(rohtext); name = j.name || null; meldung = j.message || null; } catch (_) {}
        return res.status(502).json({
          ok: false,
          fehler: 'Versand fehlgeschlagen',
          diagnose: { status: antwort.status, name, meldung, absender: ABSENDER, empfaenger: EMPFAENGER }
        });
      }

      return res.status(502).json({ ok: false, fehler: 'Versand fehlgeschlagen' });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Netzwerkfehler beim Versand', e);
    return res.status(502).json({ ok: false, fehler: 'Versand fehlgeschlagen' });
  }
};

function safeParse(s) {
  try { return JSON.parse(s); } catch { return {}; }
}
