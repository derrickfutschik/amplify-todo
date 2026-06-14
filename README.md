# amplify-todo

A full-stack todo app built with AWS Amplify Gen 2, structured as a multi-module monorepo. The backend is split into two layers so stable shared infrastructure (auth) is never touched during feature work.

---

## Monorepo layout

```
amplify-todo/
├── apps/
│   └── todo-app/                    # React + Vite frontend
│       └── src/
│           ├── main.tsx             # Amplify.configure() + Authenticator
│           ├── client.ts            # Typed generateClient<Schema>
│           ├── App.tsx
│           └── components/
│               └── TodoList.tsx
│
├── packages/
│   ├── platform/                    # ★ STABLE — deploy from main/release only
│   │   └── amplify/
│   │       ├── auth/resource.ts     # Cognito User Pool shared across all features
│   │       └── backend.ts
│   │
│   └── todo-backend/                # ★ PER-FEATURE — deploy from any branch
│       └── amplify/
│           ├── data/resource.ts     # Todo data model (evolves per feature)
│           └── backend.ts           # Imports auth from platform
│
├── turbo.json                       # Task pipeline with dependency graph
├── pnpm-workspace.yaml              # pnpm workspace definition
├── package.json                     # npm workspaces + root scripts
└── amplify.yml                      # Amplify CI/CD build config (3 apps)
```

---

## Platform vs feature resources

| | `packages/platform` | `packages/todo-backend` |
|---|---|---|
| **What lives here** | Auth (Cognito), shared storage, VPC | Data models, Lambda functions, feature flags |
| **When to deploy** | `main` / `release` branches only | Any branch — including feature branches |
| **Change frequency** | Rare — coordinate carefully | Frequent — iterate freely |
| **Amplify Console app** | One app, locked to `main` | One app, deploys every branch |

`todo-backend` imports the `auth` definition from `platform` so the data API always authorizes against the same Cognito user pool, regardless of which branch is active.

---

## Prerequisites

- Node.js 18+
- AWS account with credentials configured (`aws configure` or env vars)
- pnpm 9+ **or** npm 10+
- Optional global install: `npm i -g turbo`

---

## Running locally

### 1 — Clone and install

```bash
git clone <your-repo-url>
cd amplify-todo

# pnpm (recommended)
pnpm install

# or npm
npm install
```

### 2 — Start the backend sandbox

The sandbox provisions your backend resources in your personal AWS account and writes
`packages/todo-backend/amplify_outputs.json` (gitignored — never commit it). It watches
for file changes and hot-reloads the backend automatically. **Leave this running in a
dedicated terminal.**

```bash
# npm
npm run sandbox:todo

# pnpm
pnpm --filter @amplify-todo/todo-backend sandbox

# turbo
turbo sandbox --filter=@amplify-todo/todo-backend

# or run directly
cd packages/todo-backend && npx ampx sandbox
```

The first run takes ~3–5 minutes to provision resources. Subsequent starts are faster.

> **Working on auth?** Run the platform sandbox instead:
> ```bash
> npm run sandbox:platform
> # or: cd packages/platform && npx ampx sandbox
> ```

### 3 — Start the frontend dev server

In a **second terminal**, once the sandbox has written `amplify_outputs.json`:

```bash
# npm
npm run dev

# pnpm
pnpm --filter @amplify-todo/todo-app dev

# turbo
turbo dev --filter=@amplify-todo/todo-app
```

App runs at **http://localhost:5173**. Sign up with any email address to start using it.

### 4 — Stop the sandbox when done

Press `Ctrl+C` in the sandbox terminal. To also delete the provisioned AWS resources:

```bash
# npm
npm run sandbox:todo -- delete

# directly
cd packages/todo-backend && npx ampx sandbox delete
```

---

## Feature branch workflow

This is the day-to-day flow for adding a new feature.

### 1 — Create a branch

```bash
git checkout -b feature/my-feature
```

### 2 — Develop locally with the sandbox

Start the sandbox as described above — it creates an isolated cloud environment
for your branch automatically.

Make changes to `packages/todo-backend/amplify/data/resource.ts` (or any feature
resource) and the sandbox hot-reloads the backend. Make changes to `apps/todo-app/src`
and Vite hot-reloads the frontend.

### 3 — Push and open a pull request

```bash
git add -A
git commit -m "feat: describe your change"
git push -u origin feature/my-feature
```

Opening a PR triggers Amplify CI automatically:
- **todo-backend app** — deploys a branch environment with your data schema changes
- **todo-app (frontend)** — builds against that branch environment and publishes a preview URL

The **platform app** is not triggered (it is locked to `main` only), so auth is untouched.

### 4 — Review the preview URL

The Amplify Console posts a preview URL as a PR status check. Share it with reviewers
to test the full stack in the cloud without merging.

### 5 — Merge to main

```bash
# via GitHub/GitLab UI, or:
git checkout main
git merge feature/my-feature
git push
```

Merging triggers:
- **platform app** — redeploys only if `packages/platform/**` changed
- **todo-backend app** — redeploys the `main` branch environment
- **todo-app (frontend)** — rebuilds against the updated `main` backend

Amplify automatically deletes the feature branch environment once the branch is merged.

---

## Deploying to AWS Amplify (first-time setup)

Create **three separate apps** in the [Amplify Console](https://console.aws.amazon.com/amplify).

### App 1 — Platform (auth)

1. **New app → Host web app** → connect your repo
2. Select the `main` branch
3. Under **Monorepo settings**, tick **"My app is a monorepo"** and set the app root to:
   ```
   packages/platform
   ```
4. Deploy. In **Branch settings**, restrict future deployments to `main` only.
5. Copy the **App ID** from the console (e.g. `d1abc123xyz`).

### App 2 — Todo backend (data)

1. **New app → Host web app** → same repo
2. Select `main` (Amplify will auto-connect future branches as they are pushed)
3. Monorepo app root:
   ```
   packages/todo-backend
   ```
4. Deploy. Copy the **App ID** — you'll use it as `TODO_BACKEND_APP_ID` in App 3.

### App 3 — Frontend

1. **New app → Host web app** → same repo
2. Monorepo app root:
   ```
   apps/todo-app
   ```
3. Under **Environment variables**, add:
   ```
   TODO_BACKEND_APP_ID = <App ID from App 2>
   ```
4. Deploy. The `preBuild` step in `amplify.yml` runs `ampx generate outputs` to pull the
   backend config before the React build starts.

### Pulling outputs manually (point local dev at a deployed branch)

`amplify_outputs.json` is gitignored and never committed. It is always generated —
either by the sandbox for local dev, or by `ampx generate outputs` in CI. To point
your local frontend at a deployed branch instead of a sandbox:

```bash
npx ampx generate outputs \
  --branch main \
  --app-id <TODO_BACKEND_APP_ID> \
  --out-dir packages/todo-backend
```

---

## Building for production locally

```bash
# turbo
turbo build

# npm
npm run build

# pnpm
pnpm --filter @amplify-todo/todo-app build
```

Output: `apps/todo-app/dist/`

---

## Turbo task graph

| Task | Depends on | Cached | Notes |
|---|---|---|---|
| `build` | `^build`, `generate-outputs` | Yes | Builds packages in dependency order |
| `dev` | `^generate-outputs` | No (persistent) | Vite dev server |
| `sandbox` | — | No (persistent) | Deploys + watches backend |
| `generate-outputs` | — | No | Writes `amplify_outputs.json` |
| `preview` | `build` | No (persistent) | Serves the production build locally |

`^` means "run in all upstream packages first" — so `todo-app#build` waits for
`generate-outputs` to complete in `todo-backend` before starting.

---

## Package manager reference

| Operation | npm | pnpm | turbo |
|---|---|---|---|
| Install | `npm install` | `pnpm install` | — |
| Dev server | `npm run dev` | `pnpm --filter @amplify-todo/todo-app dev` | `turbo dev` |
| Build | `npm run build` | `pnpm --filter @amplify-todo/todo-app build` | `turbo build` |
| Todo sandbox | `npm run sandbox:todo` | `pnpm --filter @amplify-todo/todo-backend sandbox` | `turbo sandbox --filter=@amplify-todo/todo-backend` |
| Platform sandbox | `npm run sandbox:platform` | `pnpm --filter @amplify-todo/platform sandbox` | `turbo sandbox --filter=@amplify-todo/platform` |
| Todo outputs | `npm run generate-outputs:todo` | `pnpm --filter @amplify-todo/todo-backend generate-outputs` | `turbo generate-outputs --filter=@amplify-todo/todo-backend` |
| Platform outputs | `npm run generate-outputs:platform` | `pnpm --filter @amplify-todo/platform generate-outputs` | `turbo generate-outputs --filter=@amplify-todo/platform` |
| Preview (prod build) | `npm run preview` | `pnpm --filter @amplify-todo/todo-app preview` | `turbo preview` |
