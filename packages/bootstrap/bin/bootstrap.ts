import * as cdk from 'aws-cdk-lib';
import { BootstrapStack } from '../lib/bootstrap-stack.js';

const app = new cdk.App();

new BootstrapStack(app, 'AmplifyTodoBootstrap', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  domainName: app.node.tryGetContext('domainName'),
});
