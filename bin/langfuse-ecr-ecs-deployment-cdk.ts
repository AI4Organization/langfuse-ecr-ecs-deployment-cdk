#!/usr/bin/env node
import 'source-map-support/register';

import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { CdkLangfuseEcrEcsFargateCloudFrontDeploymentStack } from '../lib/langfuse-ecr-ecs-fargate-deployment-cdk-stack';
import { checkEnvVariables } from '../utils/check-environment-variable';
import { parsePlatforms } from '../utils/parsing-platform-variable';

dotenv.config(); // Load environment variables from .env file
const app = new cdk.App();

const { CDK_DEFAULT_ACCOUNT: account, CDK_DEFAULT_REGION: region } = process.env;

const cdkRegions = process.env.CDK_DEPLOY_REGIONS?.split(',') ?? [region]; // Parsing comma separated list of regions
const deployEnvironments = process.env.ENVIRONMENTS?.split(',') ?? ['dev']; // Parsing comma separated list of environments

export const LATEST_IMAGE_VERSION = 'latest';

// check general stack props
checkEnvVariables('ECR_REPOSITORY_NAME', 'APP_NAME', 'IMAGE_VERSION', 'PORT', 'PLATFORMS');

const appName = process.env.APP_NAME!;
console.log(`process.env.PLATFORMS: ${process.env.PLATFORMS}`);
const platforms = parsePlatforms(process.env.PLATFORMS!.split(','));

for (const cdkRegion of cdkRegions) {
  for (const environment of deployEnvironments) {
    for (const platform of platforms) {
      const platformString = platform === Platform.LINUX_AMD64 ? 'amd64' : 'arm';
      console.log(`platformString: ${platformString}, deployRegion: ${cdkRegion}, environment: ${environment}`);
      new CdkLangfuseEcrEcsFargateCloudFrontDeploymentStack(app, `${appName}-${environment}-${cdkRegion}-${platformString}-CdkLangfuseEcrEcsFargateCloudFrontDeploymentStack`, {
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
        platformString,
        appName,
        stackName: `${appName}-${environment}-${cdkRegion}-${platformString}-CdkLangfuseEcrEcsFargateCloudFrontDeploymentStack`,
        description: `Langfuse ECR/ECS with Fargate deployment stack for ${environment} environment in ${cdkRegion} region.`,
      });
    }
  }
}
