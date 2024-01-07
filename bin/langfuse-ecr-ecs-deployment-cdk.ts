#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { CdkLangfuseEcrEcsFargateDeploymentStack } from '../lib/langfuse-ecr-ecs-fargate-deployment-cdk-stack';
import { checkEnvVariables } from '../utils/check-environment-variable';
import { IEnvTypes } from '../process-env-typed';

dotenv.config(); // Load environment variables from .env file
const app = new cdk.App();

const { CDK_DEFAULT_ACCOUNT: account, CDK_DEFAULT_REGION: region } = process.env;

const cdkRegions = process.env.CDK_DEPLOY_REGIONS?.split(',') ?? [region]; // Parsing comma separated list of regions
const deployEnvironments = process.env.ENVIRONMENTS?.split(',') ?? ['dev']; // Parsing comma separated list of environments

export const LATEST_IMAGE_VERSION = 'latest';

// check general stack props
checkEnvVariables('ECR_REPOSITORY_NAME', 'APP_NAME', 'IMAGE_VERSION', 'PORT');

const appName = process.env.APP_NAME!;

for (const cdkRegion of cdkRegions) {
  for (const environment of deployEnvironments) {
    new CdkLangfuseEcrEcsFargateDeploymentStack(app, `${appName}-${environment}-${cdkRegion}-CdkLangfuseEcrEcsDeploymentStack`, {
      env: {
        account,
        region: cdkRegion,
      },
      tags: {
        environment,
        appName: appName,
        AppManagerCFNStackKey: 'true',
      },
      deployRegion: cdkRegion,
      environment,
      appName,
      stackName: `${appName}-${environment}-${cdkRegion}-CdkLangfuseEcrEcsDeploymentStack`,
      description: `Langfuse ECR/ECS deployment stack for ${environment} environment in ${cdkRegion} region.`,
    });
  }
}