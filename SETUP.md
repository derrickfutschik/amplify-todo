# Setup Guide

This guide covers first-time setup from a fresh clone to a fully running AWS environment. For day-to-day development, see the [README](README.md).

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| pnpm | 8+ | `npm i -g pnpm` |
| AWS CLI | v2 | [docs.aws.amazon.com/cli](https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html) |
| AWS CDK CLI | v2 | `npm i -g aws-cdk` |

Configure your AWS credentials before continuing:

```bash
aws configure
```

---

## Overview

Setup happens in three stages, in order:

```
1. Bootstrap  →  CDK stack creates all 3 Amplify apps in AWS
2. Platform   →  First Amplify deploy writes auth config to SSM
3. Connect    →  Link GitHub to todo-backend and todo-app
```

The todo-backend depends on the SSM parameter that platform writes, so platform must be fully deployed before todo-backend can build.

---

## Stage 1 — Run the bootstrap CDK stack

The `packages/bootstrap` CDK stack provisions everything the project needs in AWS:

- A shared Amplify IAM service role (with SSM read permission)
- Three Amplify apps: `amplify-todo-platform`, `amplify-todo-backend`, `amplify-todo-app`
- `TODO_BACKEND_APP_ID` environment variable pre-wired on the frontend app
- Optionally, a custom domain on the frontend app

### 1.1 — Install dependencies

```bash
pnpm install
```

### 1.2 — Bootstrap CDK (once per AWS account/region)

```bash
cd packages/bootstrap
npx cdk bootstrap
```

This creates the CDK staging bucket and roles in your account. Only needed once.

### 1.3 — Deploy the bootstrap stack

From the repo root:

```bash
# Without a custom domain
npm run bootstrap:deploy

# With a custom domain
cd packages/bootstrap && npx cdk deploy -c domainName=yourdomain.com
```

When it finishes, the outputs show the App ID for each Amplify app:

```
Outputs:
AmplifyTodoBootstrap.PlatformAppId    = d1xxxxxxxxx  (appRoot: packages/platform)
AmplifyTodoBootstrap.TodoBackendAppId = d2xxxxxxxxx  (appRoot: packages/todo-backend)
AmplifyTodoBootstrap.TodoAppId        = d3xxxxxxxxx  (appRoot: apps/todo-app)
```

Save these — you'll need them in Stage 3.

---

## Stage 2 — Deploy the platform app and verify SSM

### 2.1 — Connect GitHub to the platform app

1. Open the [Amplify Console](https://console.aws.amazon.com/amplify)
2. Find the `amplify-todo-platform` app (created by the CDK stack)
3. Click **Connect repository**
4. Select your repo and the `main` branch
5. Set **App root directory**: `packages/platform`
6. Save — Amplify triggers an initial build automatically

### 2.2 — Wait for the platform build to complete

The first build takes ~5–10 minutes. Once it succeeds, verify the SSM parameter was written:

```bash
aws ssm get-parameter --name /derrops/amplify-todo/platform
```

You should see a JSON value containing `userPoolId`, `userPoolClientId`, `identityPoolId`, `authRoleArn`, and `unauthRoleArn`. If the parameter is missing, check the Amplify build logs for errors.

---

## Stage 3 — Connect todo-backend and todo-app

Now that the platform SSM parameter exists, the remaining two apps can be connected.

### 3.1 — Connect GitHub to todo-backend

1. Find the `amplify-todo-backend` app in the Amplify Console
2. Click **Connect repository**
3. Select your repo and the `main` branch
4. Set **App root directory**: `packages/todo-backend`
5. Save

The todo-backend build reads the SSM parameter and deploys the AppSync data API.

### 3.2 — Connect GitHub to todo-app

1. Find the `amplify-todo-app` app in the Amplify Console
2. Click **Connect repository**
3. Select your repo and the `main` branch
4. Set **App root directory**: `apps/todo-app`
5. Save

The todo-app build pulls outputs from todo-backend (via `TODO_BACKEND_APP_ID`, already set by the CDK stack) and builds the React frontend.

---

## Stage 4 — Local development (optional)

To run the full stack locally, the sandbox order mirrors the production dependency chain.

### Terminal 1 — Platform sandbox

```bash
npm run sandbox:platform
```

Deploys auth to your personal AWS account and writes the SSM parameter. Takes ~3–5 minutes on first run. Leave it running.

### Terminal 2 — Todo-backend sandbox

Once the platform sandbox finishes its first deployment:

```bash
npm run sandbox:todo
```

Reads the SSM parameter and deploys the AppSync data API. Leave it running.

### Terminal 3 — Frontend dev server

Once the todo-backend sandbox has written `packages/todo-backend/amplify_outputs.json`:

```bash
npm run dev
```

App runs at **http://localhost:5173**.

### Stopping sandboxes

`Ctrl+C` in each sandbox terminal stops the watcher. To also delete the provisioned AWS resources:

```bash
cd packages/platform && npx ampx sandbox delete
cd packages/todo-backend && npx ampx sandbox delete
```

---

## Custom domain setup

If you passed `-c domainName=yourdomain.com` to the CDK deploy in Stage 1, the domain is already associated with the todo-app in Amplify.

**Route 53 managed domain:** Amplify automatically verifies and creates DNS records. No further action needed after the CDK deploy.

**External DNS (Cloudflare, GoDaddy, etc.):** After the CDK deploy, open the `amplify-todo-app` in the Amplify Console, go to **Domain management**, and follow the prompts to add the CNAME records to your DNS provider.

To add a domain after initial setup:

```bash
cd packages/bootstrap && npx cdk deploy -c domainName=yourdomain.com
```

---

## Updating the bootstrap stack

If you change the CDK stack (e.g. add a new app, modify the domain, change IAM permissions):

```bash
npm run bootstrap:diff    # preview what will change
npm run bootstrap:deploy  # apply changes
```

---

## Troubleshooting

**todo-backend build fails with "parameter not found"**
The platform app hasn't completed its first deploy yet, or the SSM parameter wasn't created. Verify with `aws ssm get-parameter --name /derrops/amplify-todo/platform` and check the platform build logs.

**todo-app build fails with missing `amplify_outputs.json`**
The `preBuild` step runs `ampx generate outputs` using `TODO_BACKEND_APP_ID`. Confirm the todo-backend app has at least one successful deploy on the same branch.

**CDK bootstrap fails with permissions error**
Your AWS credentials need permission to create IAM roles and S3 buckets. Ensure your IAM user or role has sufficient permissions, or use an admin account for the initial bootstrap.

**Domain not resolving after setup**
For Route 53, allow up to 15 minutes for Amplify to provision the ACM certificate. For external DNS, propagation can take up to 48 hours after adding CNAME records.
