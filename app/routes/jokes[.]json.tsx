import type { LoaderArgs } from '@remix-run/node';

import { db } from '~/utils/db.server';

function escapeCdata(s: string) {
  return s.replace(/\]\]>/g, ']]]]><![CDATA[>');
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export const loader = async ({ request }: LoaderArgs) => {
  const jokes = await db.joke.findMany({
    include: { jokester: { select: { username: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const host =
    request.headers.get('X-Forwarded-Host') ?? request.headers.get('host');
  if (!host) {
    throw new Error('Could not determine domain URL.');
  }
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const domain = `${protocol}://${host}`;
  const jokesUrl = `${domain}/jokes`;
  const data = {
    title: 'Remix Jokes',
    link: jokesUrl,
    description: 'Some funny jokes',
    language: 'en-us',
    jokes,
  };
  const json = JSON.stringify(data, null, 2);

  return new Response(json, {
    headers: {
      'Cache-Control': `public, max-age=${60 * 10}, s-maxage=${60 * 60 * 24}`,
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(json)),
    },
  });
};
