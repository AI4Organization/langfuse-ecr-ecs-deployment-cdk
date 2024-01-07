#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { CdkLangfuseEcrEcsDeploymentStack } from '../lib/langfuse-ecr-ecs-deployment-cdk-stack';
import { checkEnvVariables } from '../utils/check-environment-variable';
import { IEnvTypes } from '../process-env-typed';
import { CdkLangfuseEcrEcsDeploymentStack2 } from '../lib/langfuse-ecr-ecs-deployment-cdk-stack2';

dotenv.config(); // Load environment variables from .env file
const app = new cdk.App();

const { CDK_DEFAULT_ACCOUNT: account, CDK_DEFAULT_REGION: region } = process.env;

const cdkRegions = process.env.CDK_DEPLOY_REGIONS?.split(',') ?? [region]; // Parsing comma separated list of regions
const deployEnvironments = process.env.ENVIRONMENTS?.split(',') ?? ['dev']; // Parsing comma separated list of environments

export const LATEST_IMAGE_VERSION = 'latest';

// check general stack props
checkEnvVariables('ECR_REPOSITORY_NAME', 'APP_NAME', 'IMAGE_VERSION', 'PORT');

const envTyped: IEnvTypes = {
    ECR_REPOSITORY_NAME: process.env.ECR_REPOSITORY_NAME!,
    APP_NAME: process.env.APP_NAME!,
    IMAGE_VERSION: process.env.IMAGE_VERSION!,
    PORT: process.env.PORT!,
};

for (const cdkRegion of cdkRegions) {
  for (const environment of deployEnvironments) {
    // new CdkLangfuseEcrEcsDeploymentStack(app, `${envTyped.APP_NAME}-${environment}-${cdkRegion}-CdkLangfuseEcrEcsDeploymentStack`, {
    //   env: {
    //     account,
    //     region: cdkRegion,
    //   },
    //   tags: {
    //     environment,
    //     appName: envTyped.APP_NAME,
    //     AppManagerCFNStackKey: 'true',
    //   },
    //   deployRegion: cdkRegion,
    //   environment,
    //   envTyped,
    //   appName: envTyped.APP_NAME,
    //   stackName: `${envTyped.APP_NAME}-${environment}-${cdkRegion}-CdkLangfuseEcrEcsDeploymentStack`,
    //   description: `Langfuse ECR/ECS deployment stack for ${environment} environment in ${cdkRegion} region.`,
    // });

    new CdkLangfuseEcrEcsDeploymentStack2(app, `${envTyped.APP_NAME}-${environment}-${cdkRegion}-CdkLangfuseEcrEcsDeploymentStack2`, {
      env: {
        account,
        region: cdkRegion,
      },
      tags: {
        environment,
        appName: envTyped.APP_NAME,
        AppManagerCFNStackKey: 'true',
      },
      deployRegion: cdkRegion,
      environment,
      envTyped,
      appName: envTyped.APP_NAME,
      stackName: `${envTyped.APP_NAME}-${environment}-${cdkRegion}-CdkLangfuseEcrEcsDeploymentStack2`,
      description: `Langfuse ECR/ECS deployment stack for ${environment} environment in ${cdkRegion} region.`,
    });
  }
}
