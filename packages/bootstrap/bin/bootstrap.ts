import * as cdk from 'aws-cdk-lib';
import { BootstrapStack } from '../lib/bootstrap-stack.js';

import { bootstrapConvention } from '@amplify-todo/common';

const app = new cdk.App();

new BootstrapStack(app, bootstrapConvention.name({ type: 'cloudFormationStack' }), {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  domainName: app.node.tryGetContext('domainName'),
});
