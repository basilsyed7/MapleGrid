import type { Env } from '@cloudflare/workers-types';

interface ContactPayload {
  name?: string;
  company?: string;
  email?: string;
  message?: string;
}

const RESPONSE_HEADERS = {
  'content-type': 'application/json',
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'POST, OPTIONS',
  'access-control-allow-headers': 'Content-Type'
};

const validatePayload = (payload: ContactPayload) => {
  if (!payload.name || payload.name.trim().length < 2) {
    return 'Please include your name.';
  }
  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return 'Please provide a valid email.';
  }
  if (!payload.message || payload.message.trim().length < 10) {
    return 'Message should be at least 10 characters.';
  }
  return null;
};

export interface ContactEnv extends Env {
  RESEND_API_KEY: string;
  CONTACT_TO: string;
  CONTACT_FROM?: string;
}

async function sendEmail(env: ContactEnv, payload: ContactPayload) {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY');
  }

  const toAddress = env.CONTACT_TO ?? 'basil@maplegrid.net';
  const fromAddress = env.CONTACT_FROM ?? 'MapleGrid Data <notifications@maplegrid.net>';

  const subject = `MapleGrid Data — Contact request from ${payload.name}`;
  const html = `
    <h2>New contact submission</h2>
    <ul>
      <li><strong>Name:</strong> ${payload.name ?? ''}</li>
      <li><strong>Company:</strong> ${payload.company ?? ''}</li>
      <li><strong>Email:</strong> ${payload.email ?? ''}</li>
    </ul>
    <p><strong>Message:</strong></p>
    <pre style="white-space: pre-wrap; font-family: inherit;">${payload.message ?? ''}</pre>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [toAddress],
      reply_to: payload.email,
      subject,
      html
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API error: ${response.status} ${errorText}`);
  }
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: RESPONSE_HEADERS
  });
};

export const onRequestPost: PagesFunction<ContactEnv> = async ({ request, env }) => {
  try {
    const payload = (await request.json()) as ContactPayload;
    const validationError = validatePayload(payload);
    if (validationError) {
      return new Response(JSON.stringify({ success: false, error: validationError }), {
        status: 400,
        headers: RESPONSE_HEADERS
      });
    }

    await sendEmail(env, payload);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: RESPONSE_HEADERS
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 500,
      headers: RESPONSE_HEADERS
    });
  }
};
