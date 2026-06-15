import { defineBackend, referenceAuth } from '@aws-amplify/backend';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { data } from './data/resource';
import { PLATFORM_SSM_PARAM } from '@amplify-todo/common';

const ssm = new SSMClient({});
const { Parameter } = await ssm.send(
  new GetParameterCommand({ Name: PLATFORM_SSM_PARAM })
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
