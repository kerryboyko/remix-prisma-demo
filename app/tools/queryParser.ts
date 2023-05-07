import type { LoaderArgs } from '@remix-run/node';

export const queryParser = ({
  url,
}: LoaderArgs['request']): Record<string, string | number> => {
  const parsable = new URL(url);
  return Array.from(parsable.searchParams.entries()).reduce(
    (pv, [key, val]) => Object.assign(pv, { [key]: val }),
    {}
  );
};

export default queryParser;
