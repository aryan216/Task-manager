# Alder

Alder is a workspace for projects, people, and tasks. A team gets a workspace, splits work into projects, and tracks each task on a table, a kanban board, or a calendar.

It is a Next.js app. The interesting part is not the board itself. It is how a request is checked, stored, and cached so the same patterns hold when the product grows.

## What you can do

- Create an account with email and password, or with GitHub.
- Open a workspace, invite people with a link, and give them an admin or member role.
- Add projects, attach a cover image, and assign tasks with a status, a due date, and a person.
- Switch a task list between table, kanban, and calendar. Filters live in the URL, so a view can be shared.
- See how many tasks were created, completed, assigned, or left overdue this month compared with last month.

Admins manage the workspace. Members can work on projects and tasks. You cannot remove the last person in a workspace, and someone who still has tasks assigned to them has to be reassigned first.

## Why it is built this way

Postgres is the record of users, sessions, workspaces, and tasks. If Redis is down, a session can still be read from Postgres, and sign-in still works. Redis only remembers things that are safe to lose: the session user for the next request, a 60-second copy of the analytics counts, and the counters that rate-limit login, registration, and the GitHub callback.

Passwords are hashed with scrypt. The session token sits in an httpOnly cookie, not in local storage. GitHub sign-in asks for the user's profile and email, and it will only create or link an account when GitHub says that email is verified. If someone already registered with that email, the GitHub identity is attached to the existing user.

Workspace and project images go to ImageKit. The database stores the URL. Putting the file bytes in Postgres made every avatar read a database query.

The browser does not talk to the database. A page or a Hono route validates the input, checks the session, and calls a service. The service is where membership, roles, and task rules live. Hono is mounted at `/api` and the React Query hooks call it through a typed client, so a renamed route shows up as a type error in the hook that calls it.

Modal state and task filters use the query string (`nuqs`) instead of a global store. Opening "create task" is a URL, which makes the back button and a shared link behave.

## Stack

- Next.js App Router and React for the UI
- Hono and Zod for the API
- TanStack Query for client reads and mutations
- Prisma and Postgres for data
- Upstash Redis for session cache, analytics cache, and rate limits
- ImageKit for uploaded images
- Tailwind CSS and Radix UI for the interface

## Run it locally

You need Node.js 20 or newer, a Postgres database, an ImageKit account, a GitHub OAuth app, and an Upstash Redis database. Postgres can be Neon, or the local database in `docker-compose.yml`.

```bash
docker compose up -d
npm install
cp .env.example .env
npx prisma migrate deploy
npm run dev
```

The app runs at `http://localhost:3000`. `NEXT_PUBLIC_APP_URL` has to be that same origin. The GitHub OAuth callback is `{NEXT_PUBLIC_APP_URL}/api/auth/github/callback`.

If you use the compose file, the database URL is:

```
postgresql://postgres:postgres@localhost:5432/jeera
```

## Environment

Copy `.env.example` to `.env`. Do not commit `.env`.

| Variable | Why it is there |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. Users, sessions, and tasks live here. |
| `NEXT_PUBLIC_APP_URL` | Public origin of this app. The API client and the GitHub redirect use it. |
| `IMAGEKIT_URL_ENDPOINT` | ImageKit URL, such as `https://ik.imagekit.io/your_imagekit_id`. |
| `IMAGEKIT_PRIVATE_KEY` | Server-side upload key. Never expose this in the browser. |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client id. |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret. |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint. |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token. |

## Scripts

- `npm run dev` starts the app.
- `npm run build` generates the Prisma client and builds Next.js.
- `npm run lint` runs ESLint.
- `npm run db:migrate` creates a new Prisma migration while developing.
- `npx prisma migrate deploy` applies the migrations that are already in the repo.
