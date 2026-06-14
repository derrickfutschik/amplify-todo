import { defineBackend, referenceAuth } from '@aws-amplify/backend';
import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm';
import { data } from './data/resource';

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
