# amplify-todo

A full-stack todo app built with AWS Amplify Gen 2, structured as a multi-module monorepo. The backend is split into two distinct layers to model real-world branching strategies.

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
│   ├── platform-backend/            # ★ STABLE — deploy from main/release only
│   │   └── amplify/
│   │       ├── auth/resource.ts     # Cognito User Pool (shared across all features)
│   │       └── backend.ts
│   │
│   └── feature-backend/             # ★ PER-FEATURE — deploy from any branch
│       └── amplify/
│           ├── data/resource.ts     # Todo data model (evolves per feature)
│           └── backend.ts           # Imports auth from platform-backend
│
├── turbo.json                        # Task pipeline with proper dependency graph
├── pnpm-workspace.yaml               # pnpm workspace definition
├── package.json                      # npm workspaces + root scripts
└── amplify.yml                       # Amplify CI/CD build config (3 apps)
```

---

## Platform vs feature resources

| | `packages/platform-backend` | `packages/feature-backend` |
|---|---|---|
| **What lives here** | Auth (Cognito), shared storage, VPC | Data models, Lambda functions, feature flags |
| **When to deploy** | `main` / `release` branches only | Any branch — including feature branches |
| **Change frequency** | Rare — breaking auth changes are carefully coordinated | Frequent — iterate on schema and business logic freely |
| **Amplify Console app** | One app, locked to `main` branch | One app per environment / branch |

The `feature-backend` imports the `auth` resource definition from `platform-backend` so data authorization always targets the same Cognito user pool, regardless of which branch is being deployed.

---

## Prerequisites

- Node.js 18+
- An AWS account configured (`aws configure` or env vars)
- pnpm 9+ **or** npm 10+
- Optional global: `turbo` (`npm i -g turbo`)

---

## Local development

### 1 — Install dependencies

```bash
# pnpm (recommended)
pnpm install

# npm
npm install
```

### 2 — Start the sandbox

The sandbox deploys your backend into a personal cloud environment and writes
`packages/feature-backend/amplify_outputs.json`. Leave it running — it watches
for changes to your Amplify files.

```bash
# turbo
turbo sandbox --filter=@amplify-todo/feature-backend

# npm workspace
npm run sandbox:feature

# pnpm
pnpm --filter @amplify-todo/feature-backend sandbox

# directly
cd packages/feature-backend && npx ampx sandbox
```

> **Note:** To work on platform resources (auth), run the platform sandbox instead:
> ```bash
> npm run sandbox:platform
> # or: cd packages/platform-backend && npx ampx sandbox
> ```

### 3 — Start the dev server

In a separate terminal:

```bash
# turbo
turbo dev --filter=@amplify-todo/todo-app

# npm
npm run dev

# pnpm
pnpm --filter @amplify-todo/todo-app dev
```

App runs at **http://localhost:5173**.

---

## Building for production

```bash
# turbo (runs generate-outputs first if needed)
turbo build

# npm workspace
npm run build

# pnpm
pnpm --filter @amplify-todo/todo-app build
```

Output: `apps/todo-app/dist/`

---

## Deploying to AWS Amplify

Create **three separate apps** in the [Amplify Console](https://console.aws.amazon.com/amplify) — one per package root.

### App 1 — Platform backend (deploy from `main` only)

1. New app → connect repo → set **App root** to `packages/platform-backend`.
2. Amplify discovers `amplify/backend.ts` and deploys auth.
3. In **Branch settings**, restrict deployments to the `main` branch.
4. Note the **App ID** (needed for App 3).

### App 2 — Feature backend (deploy from any branch)

1. New app → connect repo → set **App root** to `packages/feature-backend`.
2. Amplify deploys auth + data on every branch push.
3. Note the **App ID** (needed for App 3).

### App 3 — Frontend

1. New app → connect repo → set **App root** to `apps/todo-app`.
2. Add environment variable **`FEATURE_APP_ID`** = the App ID from App 2.
3. Amplify runs `npx ampx generate outputs` to pull backend config, then builds the React app.

The `amplify.yml` at the repo root defines the build phases for all three apps.

### Pulling outputs from a deployed branch manually

```bash
npx ampx generate outputs \
  --branch main \
  --app-id <FEATURE_APP_ID> \
  --out-dir packages/feature-backend
```

---

## Turbo task graph

Tasks are ordered so that backend outputs exist before the frontend builds or starts.

| Task | Depends on | Cached | Notes |
|---|---|---|---|
| `build` | `^build`, `generate-outputs` | Yes | Builds all packages in order |
| `dev` | `^generate-outputs` | No (persistent) | Starts Vite dev server |
| `sandbox` | — | No (persistent) | Deploys + watches backend |
| `generate-outputs` | — | No | Writes `amplify_outputs.json` |
| `preview` | `build` | No (persistent) | Serves production build locally |

The `^` prefix means "run this task in all upstream packages first." So `build` in
`todo-app` won't start until `generate-outputs` completes in the backend packages it
depends on.

---

## Package manager reference

| Operation | npm | pnpm | turbo |
|---|---|---|---|
| Install | `npm install` | `pnpm install` | — |
| Dev server | `npm run dev` | `pnpm --filter @amplify-todo/todo-app dev` | `turbo dev` |
| Build | `npm run build` | `pnpm --filter @amplify-todo/todo-app build` | `turbo build` |
| Feature sandbox | `npm run sandbox:feature` | `pnpm --filter @amplify-todo/feature-backend sandbox` | `turbo sandbox --filter=@amplify-todo/feature-backend` |
| Platform sandbox | `npm run sandbox:platform` | `pnpm --filter @amplify-todo/platform-backend sandbox` | `turbo sandbox --filter=@amplify-todo/platform-backend` |
| Feature outputs | `npm run generate-outputs:feature` | `pnpm --filter @amplify-todo/feature-backend generate-outputs` | `turbo generate-outputs --filter=@amplify-todo/feature-backend` |
