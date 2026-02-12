import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const resend = new Resend(import.meta.env.RESEND_API_KEY);

  let data: Record<string, string>;
  try {
    data = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Requête invalide.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { prenom, nom, organisation, telephone, email, message, moment } = data;

  if (!organisation || !email || !moment) {
    return new Response(
      JSON.stringify({ error: 'Veuillez remplir tous les champs obligatoires.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const formatMoment = (raw: string) => {
    const date = new Date(raw);
    return date.toLocaleDateString('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const momentFormate = formatMoment(moment);

  const htmlBody = `
    <h2>Nouveau message depuis votez.com</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
      <tr><td style="padding:8px 16px 8px 0;font-weight:bold;vertical-align:top;">Prénom</td><td style="padding:8px 0;">${prenom || '—'}</td></tr>
      <tr><td style="padding:8px 16px 8px 0;font-weight:bold;vertical-align:top;">Nom</td><td style="padding:8px 0;">${nom || '—'}</td></tr>
      <tr><td style="padding:8px 16px 8px 0;font-weight:bold;vertical-align:top;">Organisation</td><td style="padding:8px 0;">${organisation}</td></tr>
      <tr><td style="padding:8px 16px 8px 0;font-weight:bold;vertical-align:top;">Téléphone</td><td style="padding:8px 0;">${telephone || '—'}</td></tr>
      <tr><td style="padding:8px 16px 8px 0;font-weight:bold;vertical-align:top;">Courriel</td><td style="padding:8px 0;"><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td style="padding:8px 16px 8px 0;font-weight:bold;vertical-align:top;">Besoins ou questions</td><td style="padding:8px 0;">${message || '—'}</td></tr>
      <tr><td style="padding:8px 16px 8px 0;font-weight:bold;vertical-align:top;">Moment souhaité</td><td style="padding:8px 0;">${momentFormate}</td></tr>
    </table>
  `;

  const textBody = [
    'NOUVEAU MESSAGE DEPUIS VOTEZ.COM',
    '',
    `Prénom : ${prenom || '—'}`,
    `Nom : ${nom || '—'}`,
    `Organisation : ${organisation}`,
    `Téléphone : ${telephone || '—'}`,
    `Courriel : ${email}`,
    `Besoins ou questions : ${message || '—'}`,
    `Moment souhaité : ${momentFormate}`,
  ].join('\n');

  try {
    await resend.emails.send({
      from: 'Votez.com <noreply@votez.com>',
      to: 'info@votez.com',
      replyTo: email,
      subject: `Nouveau message de ${organisation}`,
      html: htmlBody,
      text: textBody,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Erreur Resend:', err);
    return new Response(
      JSON.stringify({ error: 'Une erreur est survenue lors de l\'envoi du message.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
