import type {
  LinksFunction,
  ActionArgs,
  V2_MetaFunction,
} from '@remix-run/node';
import { Link, useActionData, useSearchParams } from '@remix-run/react';
import { db } from '~/utils/db.server';
import { getFromForm } from '~/tools/getFromForm';

import loginStylesUrl from '~/styles/login.css';
import { badRequest } from '~/utils/request.server';
import { createUserSession, login, register } from '~/utils/session.server';

export const links: LinksFunction = () => [
  { rel: 'stylesheet', href: loginStylesUrl },
];

export const meta: V2_MetaFunction = () => {
  const description = 'Login to submit your own jokes to Remix Jokes!';

  return [
    { name: 'description', content: description },
    { name: 'twitter:description', content: description },
    { title: 'Remix Jokes | Login' },
  ];
};

function validateUsername(username: string): string | undefined {
  return username && username.length < 3
    ? 'Usernames must be at least three characters long'
    : undefined;
}

function validatePassword(password: string): string | undefined {
  return password && password.length < 6
    ? 'Passwords must be at least six characters long'
    : undefined;
}

function validateUrl(url: string): string {
  return url && ['/jokes', '/', 'https://remix.run'].includes(url)
    ? url
    : '/jokes';
}

export const action = async ({ request }: ActionArgs) => {
  const form = await request.formData();
  const { loginType, password, username, redirectTo } = getFromForm(
    form,
    'loginType',
    'password',
    'username',
    'redirectTo'
  );
  if (
    [loginType, password, username].some(
      (fieldData) => typeof fieldData !== 'string'
    )
  ) {
    return badRequest({
      fieldErrors: null,
      fields: null,
      formError: 'Form not submitted correctly.',
    });
  }
  const fields = { loginType, password, username };
  const fieldErrors = {
    password: validatePassword(password),
    username: validateUsername(username),
  };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields, formError: null });
  }
  if (loginType === 'login') {
    const user = await login({ username, password });
    console.log({ user });

    if (!user) {
      return badRequest({
        fieldErrors: null,
        fields,
        formError: 'Username/Password combination is incorrect',
      });
    }
    return createUserSession(user.id, redirectTo);
  }
  if (loginType === 'register') {
    const userExists = await db.user.findFirst({
      where: { username },
    });
    if (userExists) {
      return badRequest({
        fieldErrors: null,
        fields,
        formError: `User with username ${username} already exists`,
      });
    }
    const user = await register({ username, password });
    if (!user) {
      return badRequest({
        fieldErrors: null,
        fields,
        formError: 'Something went wrong trying to create a new user.',
      });
    }
    return createUserSession(user.id, redirectTo);
  }
  return badRequest({
    fieldErrors: null,
    fields,
    formError: 'Login type invalid',
  });
};

export default function LoginRoute() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') ?? undefined;
  const actionData = useActionData<typeof action>();
  return (
    <div className="container">
      <div className="content" data-light="">
        <h1>Login</h1>
        <form method="post">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <fieldset>
            <legend className="sr-only">Login or Register?</legend>
            <label>
              <input
                type="radio"
                name="loginType"
                value="login"
                defaultChecked={
                  !actionData?.fields?.loginType ||
                  actionData?.fields?.loginType === 'login'
                }
              />
              Login
            </label>
            <label>
              <input
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={actionData?.fields?.loginType === 'register'}
              />
              Register
            </label>
          </fieldset>
          <div>
            <label htmlFor="username-input">Username</label>
            <input
              type="text"
              id="username-input"
              name="username"
              defaultValue={actionData?.fields?.username}
              aria-invalid={Boolean(actionData?.fieldErrors?.username)}
              aria-errormessage={
                actionData?.fieldErrors?.username ? 'username-error' : undefined
              }
            />
            {actionData?.fieldErrors?.username ? (
              <p
                className="form-validation-error"
                role="alert"
                id="username-error"
              >
                {actionData.fieldErrors.username}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              name="password"
              type="password"
              defaultValue={actionData?.fields?.password}
              aria-invalid={Boolean(actionData?.fieldErrors?.password)}
              aria-errormessage={
                actionData?.fieldErrors?.password ? 'password-error' : undefined
              }
            />
            {actionData?.fieldErrors?.password ? (
              <p
                className="form-validation-error"
                role="alert"
                id="password-error"
              >
                {actionData.fieldErrors.password}
              </p>
            ) : null}
          </div>
          <div id="form-error-message">
            {actionData?.formError ? (
              <p className="form-validation-error" role="alert">
                {actionData.formError}
              </p>
            ) : null}
          </div>
          <button type="submit" className="button">
            Submit
          </button>
        </form>
      </div>
      <div className="links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/jokes">Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
