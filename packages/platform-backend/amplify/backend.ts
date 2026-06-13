import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';

// Platform backend: only auth (and any future shared infra like S3, VPC, etc.)
// Deploy this app from main/release branches ONLY — never from feature branches.
defineBackend({
  auth,
});
