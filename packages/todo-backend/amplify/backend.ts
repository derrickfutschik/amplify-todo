import { defineBackend } from '@aws-amplify/backend';
import { auth } from '@amplify-todo/platform/amplify/auth/resource';
import { data } from './data/resource';

// todo-backend: re-uses the shared auth definition from platform so
// Amplify creates/updates auth with the same config, then adds todo-specific
// data resources on top.
//
// Deployment rules:
//   platform     →  deploy from main/release only (auth is a shared resource)
//   todo-backend →  deploy from any branch (data schema evolves per feature)
defineBackend({
  auth,
  data,
});
