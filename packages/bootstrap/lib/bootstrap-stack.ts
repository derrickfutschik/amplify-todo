import * as cdk from 'aws-cdk-lib';
import * as amplify from 'aws-cdk-lib/aws-amplify';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface BootstrapStackProps extends cdk.StackProps {
  domainName?: string;
}

export class BootstrapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: BootstrapStackProps) {
    super(scope, id, props);

    const serviceRole = new iam.Role(this, 'AmplifyServiceRole', {
      assumedBy: new iam.ServicePrincipal('amplify.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess-Amplify'),
      ],
      inlinePolicies: {
        SsmReadPlatformParam: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['ssm:GetParameter'],
              resources: [
                `arn:aws:ssm:*:${this.account}:parameter/derrops/amplify-todo/platform`,
              ],
            }),
          ],
        }),
      },
    });

    // Platform — auth + shared infra, main branch only
    const platformApp = new amplify.CfnApp(this, 'PlatformApp', {
      name: 'amplify-todo-platform',
      iamServiceRole: serviceRole.roleArn,
      environmentVariables: [
        { name: 'AMPLIFY_MONOREPO_APP_ROOT', value: 'packages/platform' },
      ],
    });

    new amplify.CfnBranch(this, 'PlatformMainBranch', {
      appId: platformApp.attrAppId,
      branchName: 'main',
      enableAutoBuild: true,
    });

    // Todo-backend — data layer, any branch
    const todoBackendApp = new amplify.CfnApp(this, 'TodoBackendApp', {
      name: 'amplify-todo-backend',
      iamServiceRole: serviceRole.roleArn,
      environmentVariables: [
        { name: 'AMPLIFY_MONOREPO_APP_ROOT', value: 'packages/todo-backend' },
      ],
    });

    new amplify.CfnBranch(this, 'TodoBackendMainBranch', {
      appId: todoBackendApp.attrAppId,
      branchName: 'main',
      enableAutoBuild: true,
    });

    // Todo-app — frontend, TODO_BACKEND_APP_ID resolved from this stack
    const todoApp = new amplify.CfnApp(this, 'TodoApp', {
      name: 'amplify-todo-app',
      iamServiceRole: serviceRole.roleArn,
      environmentVariables: [
        { name: 'AMPLIFY_MONOREPO_APP_ROOT', value: 'apps/todo-app' },
        { name: 'TODO_BACKEND_APP_ID', value: todoBackendApp.attrAppId },
      ],
    });

    const todoAppMainBranch = new amplify.CfnBranch(this, 'TodoAppMainBranch', {
      appId: todoApp.attrAppId,
      branchName: 'main',
      enableAutoBuild: true,
    });

    if (props?.domainName) {
      new amplify.CfnDomain(this, 'TodoAppDomain', {
        appId: todoApp.attrAppId,
        domainName: props.domainName,
        subDomainSettings: [
          { branchName: todoAppMainBranch.branchName, prefix: '' },
        ],
      });
    }

    new cdk.CfnOutput(this, 'PlatformAppId', {
      value: platformApp.attrAppId,
      description: 'Connect repo → appRoot: packages/platform',
    });
    new cdk.CfnOutput(this, 'TodoBackendAppId', {
      value: todoBackendApp.attrAppId,
      description: 'Connect repo → appRoot: packages/todo-backend',
    });
    new cdk.CfnOutput(this, 'TodoAppId', {
      value: todoApp.attrAppId,
      description: 'Connect repo → appRoot: apps/todo-app',
    });
  }
}
