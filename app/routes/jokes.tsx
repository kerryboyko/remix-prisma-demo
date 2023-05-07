import { Outlet } from '@remix-run/react';
import type { LinksFunction } from '@remix-run/node';
import jokesStylesUrl from '~/styles/jokes.css';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: jokesStylesUrl },
];

export default function JokesRoute() {
  return (
    <div>
      <h1>J🤪KES</h1>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
