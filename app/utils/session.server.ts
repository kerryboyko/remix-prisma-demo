import { createCookieSessionStorage } from '@remix-run/node';
import bcrypt from 'bcryptjs';
import { redirect } from 'react-router';

import { db } from './db.server';

const SECOND_IN_MINUTES = 60;
const MINUTES_IN_HOURS = 60;
const HOURS_IN_DAY = 24;
const DAYS_IN_MONTH = 30;
const THIRTY_DAYS =
  SECOND_IN_MINUTES * MINUTES_IN_HOURS * HOURS_IN_DAY * DAYS_IN_MONTH;

type LoginForm = {
  password: string;
  username: string;
};

export async function register({ password, username }: LoginForm) {
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { passwordHash, username },
  });
  return { id: user.id, username };
}

export async function login({
  password,
  username,
}: LoginForm): Promise<{ id: string; username: string } | null> {
  const user = await db.user.findUnique({
    where: { username },
  });
  if (!user) {
    return null;
  }
  const isCorrectPassword: boolean = await bcrypt.compare(
    password,
    user.passwordHash
  );
  if (!isCorrectPassword) {
    return null;
  }
  return { id: user.id, username };
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error(`SESSION_SECRET must be set`);
}

const storage = createCookieSessionStorage({
  cookie: {
    name: 'RJ_session',
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
    sameSite: 'lax',
    path: '/',
    maxAge: THIRTY_DAYS,
    httpOnly: true,
  },
});

export async function getUserSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'));
}

export async function getUserId(request: Request): Promise<string | null> {
  const session = await getUserSession(request);
  const userId = session.get('userId');
  if (!userId || typeof userId !== 'string') {
    return null;
  }
  return userId;
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
): Promise<string> | never {
  const userId = await getUserId(request);
  if (userId === null) {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set('userId', userId);
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await storage.commitSession(session),
    },
  });
}

export async function getUser(
  request: Request
): Promise<{ id: string; username: string } | null> | never {
  const userId = await getUserId(request);
  if (typeof userId !== 'string') {
    return null;
  }
  try {
    const user = await db.user.findUnique({
      select: { id: true, username: true },
      where: { id: userId },
    });
    return user;
  } catch {
    throw logout(request);
  }
}

export async function logout(request: Request): Promise<Response> {
  const session = await getUserSession(request);
  return redirect('/login', {
    headers: {
      'Set-Cookie': await storage.destroySession(session),
    },
  });
}
