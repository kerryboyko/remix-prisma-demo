import { Link } from '@remix-run/react';

import type { LinksFunction } from '@remix-run/node';

import stylesUrl from '~/styles/index.css';

// links is a key word here
export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: stylesUrl },
];

export default function IndexRoute() {
  return (
    <div className="container">
      <div className="content">
        <h1>
          Remix <span>Jokes!</span>
        </h1>
        <nav>
          <ul>
            <li>
              <Link to="jokes">Read Jokes</Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
