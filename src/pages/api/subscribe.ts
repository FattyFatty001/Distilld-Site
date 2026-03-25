export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();
  const email = data.get('email')?.toString().trim();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'A valid email address is required.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = import.meta.env.BREVO_API_KEY;
  const listId = Number(import.meta.env.BREVO_LIST_ID);

  if (!apiKey || !listId) {
    console.error('Missing BREVO_API_KEY or BREVO_LIST_ID environment variables.');
    return new Response(JSON.stringify({ error: 'Server configuration error.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'content-type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      email,
      listIds: [listId],
      updateEnabled: true,
    }),
  });

  // 201 = created, 204 = already existed (updateEnabled updates them)
  if (res.status === 201 || res.status === 204) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body = await res.json().catch(() => ({}));
  console.error('Brevo API error:', res.status, body);
  return new Response(JSON.stringify({ error: 'Could not save your email. Please try again.' }), {
    status: 502,
    headers: { 'Content-Type': 'application/json' },
  });
};
