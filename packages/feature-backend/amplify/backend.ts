import { defineBackend } from '@aws-amplify/backend';
import { auth } from '@amplify-todo/platform-backend/amplify/auth/resource';
import { data } from './data/resource';

// Feature backend: re-uses the shared auth definition from platform-backend so
// Amplify creates/updates auth with the same config, then adds feature-specific
// data resources on top.
//
// Deployment rules:
//   platform-backend  →  deploy from main/release only (auth is a shared resource)
//   feature-backend   →  deploy from any branch (data schema evolves per feature)
defineBackend({
  auth,
  data,
});
