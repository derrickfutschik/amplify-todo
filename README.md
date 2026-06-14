# amplify-todo

A full-stack todo app built with AWS Amplify Gen 2, structured as a multi-module monorepo. The backend is split into two layers so stable shared infrastructure (auth) is never touched during feature work.

**New here?** Start with [SETUP.md](SETUP.md) to get the project running in AWS.

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
│   ├── bootstrap/                   # CDK stack — run once to set up AWS (see SETUP.md)
│   │   ├── bin/bootstrap.ts         # CDK app entry point
│   │   └── lib/bootstrap-stack.ts   # Creates all 3 Amplify apps + IAM role
│   │
│   ├── platform/                    # STABLE — deploy from main/release only
│   │   └── amplify/
│   │       ├── auth/resource.ts     # Cognito User Pool shared across all features
│   │       └── backend.ts           # Deploys auth, writes config to SSM
│   │
│   └── todo-backend/                # PER-FEATURE — deploy from any branch
│       └── amplify/
│           ├── data/resource.ts     # Todo data model (evolves per feature)
│           └── backend.ts           # Reads auth config from SSM, deploys data API
│
├── turbo.json                       # Task pipeline with dependency graph
├── pnpm-workspace.yaml              # pnpm workspace definition
├── package.json                     # Root scripts
└── amplify.yml                      # Amplify CI/CD build config (3 apps)
```

---

## How the stacks are connected

After the platform stack deploys, it writes auth config to an SSM parameter at `/derrops/amplify-todo/platform`. The todo-backend reads this at synth time and uses `referenceAuth` to wire its AppSync API to the existing Cognito resources — without ever owning or re-deploying them.

| | `packages/platform` | `packages/todo-backend` |
|---|---|---|
| **What lives here** | Auth (Cognito), shared infra | Data models, feature resources |
| **When to deploy** | `main` / `release` branches only | Any branch |
| **Change frequency** | Rare — coordinate carefully | Frequent — iterate freely |
| **Depends on** | Nothing | Platform SSM parameter |

---

## Local development

The sandbox order mirrors the production dependency chain — platform must be running before todo-backend.

**Terminal 1 — Platform sandbox**
```bash
npm run sandbox:platform
```

**Terminal 2 — Todo-backend sandbox** (once platform is ready)
```bash
npm run sandbox:todo
```

**Terminal 3 — Frontend**
```bash
npm run dev
```

App runs at **http://localhost:5173**.

---

## Feature branch workflow

```bash
git checkout -b feature/my-feature
# develop locally using the sandboxes above
git push -u origin feature/my-feature
```

Opening a PR triggers Amplify CI:
- **todo-backend** — deploys a branch environment with your schema changes
- **todo-app** — builds against it and publishes a preview URL
- **platform** — not triggered (locked to `main`), auth is untouched

---

## Script reference

| Operation | Command |
|---|---|
| Install | `pnpm install` |
| First-time AWS setup | See [SETUP.md](SETUP.md) |
| Deploy bootstrap stack | `npm run bootstrap:deploy` |
| Preview bootstrap changes | `npm run bootstrap:diff` |
| Platform sandbox | `npm run sandbox:platform` |
| Todo-backend sandbox | `npm run sandbox:todo` |
| Frontend dev server | `npm run dev` |
| Build frontend | `npm run build` |
| Generate platform outputs | `npm run generate-outputs:platform` |
| Generate todo-backend outputs | `npm run generate-outputs:todo` |

---

## Turbo task graph

| Task | Depends on | Cached | Notes |
|---|---|---|---|
| `build` | `^build`, `generate-outputs` | Yes | Builds in dependency order |
| `dev` | `^generate-outputs` | No (persistent) | Vite dev server |
| `sandbox` | — | No (persistent) | Deploys + watches backend |
| `generate-outputs` | — | No | Writes `amplify_outputs.json` |
| `preview` | `build` | No (persistent) | Serves the production build locally |
| `deploy` | — | No | CDK deploy (bootstrap only) |
| `diff` | — | No | CDK diff (bootstrap only) |
