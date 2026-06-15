import * as cdk from 'aws-cdk-lib';
import { BootstrapStack } from '../lib/bootstrap-stack.js';

import { convention } from '@amplify-todo/common';

const app = new cdk.App();

export const bootstrapConvention = convention.with({ domain: 'bootstrap', service: 'amplify' })

new BootstrapStack(app, bootstrapConvention.name({ type: 'cloudFormationStack' }), {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  domainName: app.node.tryGetContext('domainName'),
});
