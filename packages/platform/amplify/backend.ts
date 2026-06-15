import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { auth } from './auth/resource';
import { PLATFORM_SSM_PARAM } from '@amplify-todo/common';

// Platform backend: only auth (and any future shared infra like S3, VPC, etc.)
// Deploy this app from main/release branches ONLY — never from feature branches.
const backend = defineBackend({ auth });

const {
  userPool,
  userPoolClient,
  identityPoolId,
  authenticatedUserIamRole,
  unauthenticatedUserIamRole,
} = backend.auth.resources;

new StringParameter(Stack.of(userPool), 'PlatformAuthParam', {
  parameterName: PLATFORM_SSM_PARAM,
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
