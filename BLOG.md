# Building a Multi-Stack Amplify Gen 2 Monorepo

## The Problem with Single-Stack Amplify Apps

Amplify Gen 2 makes it easy to spin up a full-stack app from a single `backend.ts` file. But once a project grows — multiple feature teams, frequent schema changes, stable shared infrastructure — a single stack becomes a liability. Every branch deployment touches auth, data, and everything else at once.

This project splits that responsibility across three separate Amplify apps in a monorepo, each with a clear deployment contract.

## Project Structure

```
amplify-todo/
├── packages/
│   ├── platform/          # Auth and shared infrastructure
│   │   └── amplify/
│   │       ├── backend.ts
│   │       └── auth/resource.ts
│   └── todo-backend/      # Feature data layer
│       └── amplify/
│           ├── backend.ts
│           └── data/resource.ts
└── apps/
    └── todo-app/          # React/Vite frontend
```

The monorepo is managed with pnpm workspaces and Turbo for task orchestration.

## The Three Stacks

### 1. Platform (packages/platform)

The platform stack owns auth — a single Cognito User Pool, Identity Pool, and the two IAM roles (authenticated and unauthenticated). This is the only stack that should ever create or modify these resources.

**Deployment rule:** main/release branch only. Auth is shared infrastructure. A botched feature-branch deploy should never be able to delete or recreate the User Pool.

After the platform stack deploys, it writes its outputs to AWS SSM Parameter Store:

```
/derrops/amplify-todo/platform
{
  "auth": {
    "userPoolId": "...",
    "userPoolClientId": "...",
    "identityPoolId": "...",
    "authRoleArn": "...",
    "unauthRoleArn": "..."
  }
}
```

This is done in CDK after `defineBackend`:

```typescript
const backend = defineBackend({ auth });

const { userPool, userPoolClient, identityPoolId, authenticatedUserIamRole, unauthenticatedUserIamRole } = backend.auth.resources;

new StringParameter(Stack.of(userPool), 'PlatformAuthParam', {
  parameterName: '/derrops/amplify-todo/platform',
  stringValue: JSON.stringify({
    auth: {
      userPoolId: userPool.userPoolId,
      userPoolClientId: userPoolClient.userPoolClientId,
      identityPoolId,
      authRoleArn: authenticatedUserIamRole.roleArn,
      unauthRoleArn: unauthenticatedUserIamRole.roleArn,
    },
  }),
});
```

CDK resolves the token references at deploy time, so the SSM parameter ends up with the real ARNs and IDs — not CloudFormation placeholder strings.

### 2. Todo Backend (packages/todo-backend)

The todo-backend stack owns the data layer — an AppSync API with a `Todo` model. It does not define auth; it references the auth that platform already deployed.

**Deployment rule:** any branch. Data schema changes are feature work and can be deployed independently.

At synth time, `backend.ts` reads the SSM parameter written by platform and uses `referenceAuth` to wire up the existing Cognito resources:

```typescript
const ssm = new SSMClient({});
const { Parameter } = await ssm.send(
  new GetParameterCommand({ Name: '/derrops/amplify-todo/platform' })
);
const { auth: platformAuth } = JSON.parse(Parameter!.Value!);

const auth = referenceAuth({
  userPoolId: platformAuth.userPoolId,
  userPoolClientId: platformAuth.userPoolClientId,
  identityPoolId: platformAuth.identityPoolId,
  authRoleArn: platformAuth.authRoleArn,
  unauthRoleArn: platformAuth.unauthRoleArn,
});

defineBackend({ auth, data });
```

Top-level `await` works here because `packages/todo-backend` is an ESM package (`"type": "module"`) and `ampx` loads `backend.ts` via dynamic `import()`, which awaits the module's full evaluation before proceeding with synthesis.

### 3. Todo App (apps/todo-app)

The React frontend. At build time, Amplify pulls the todo-backend's `amplify_outputs.json` (which includes auth config from the referenced platform stack) and makes it available to the app.

## Deployment Order

```
1. Deploy platform   →  creates Cognito User Pool + writes SSM param
2. Deploy todo-backend →  reads SSM param, references platform auth, deploys AppSync
3. Deploy todo-app   →  reads todo-backend outputs, builds frontend
```

Steps 1 and 2 only need to be done once (or when auth/data config changes). Step 3 happens on every frontend change.

## Local Sandbox Workflow

For local development, the same dependency order applies:

```bash
# Terminal 1 — deploy platform sandbox (creates auth + SSM param)
npm run sandbox:platform

# Terminal 2 — deploy todo-backend sandbox (reads SSM param, deploys data)
npm run sandbox:todo

# Terminal 3 — run frontend dev server
npm run dev
```

## Why Not Just Put Everything in One Stack?

You could. For a personal project or small team, a single Amplify app is simpler. The multi-stack approach pays off when:

- Auth changes should be reviewed and deployed more carefully than data changes
- Multiple feature branches need their own data sandboxes without touching the shared User Pool
- You want to give different teams ownership over different parts of the infrastructure
