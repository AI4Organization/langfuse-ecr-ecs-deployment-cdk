# LangFuse ECR/ECS Deployment CDK

This repository contains the AWS CDK TypeScript code for deploying the LangFuse application using Amazon Elastic Container Registry (ECR) and Amazon Elastic Container Service (ECS).

## Table of Contents

- [Stacks](#stacks)
- [Configuration](#configuration)
  - [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Scripts](#scripts)
- [Dependencies](#dependencies)
  - [Development Dependencies](#development-dependencies)
  - [Production Dependencies](#production-dependencies)
- [License](#license)

## Stacks

The repository defines multiple CDK stacks for deploying the various components of the LangFuse application:

- `LangfuseEcrDeploymentCdkStack`: Deploys Docker images to an Amazon ECR repository.
- `LangfuseVpcDeploymentCdkStack`: Deploys a VPC suitable for ECS deployments.
- `CdkPostgreSQLDeploymentStack`: Deploys a PostgreSQL database instance.
- `CdkFargateWithVpcDeploymentStack`: Deploys the application using AWS Fargate within a VPC.
- `CdkAppRunnerWithVpcDeploymentStack`: Deploys the application using AWS App Runner with a VPC connector.

## Configuration

### Environment Variables

The deployment configuration relies on environment variables defined in a `.env` file. An example of the `.env` file content is provided in the file `.env.example`.

## Usage

To use this repository, ensure that you have AWS CDK installed and configured with appropriate AWS credentials. Clone the repository, install dependencies, and run the deployment scripts as needed.

## Scripts

- `build`: Compiles TypeScript to JavaScript.
- `npm run build`   compile typescript to js
- `npm run watch`   watch for changes and compile
- `npm run test`    perform the jest unit tests
- `npx cdk deploy`  deploy this stack to your default AWS account/region
- `npx cdk diff`    compare deployed stack with current state
- `npx cdk synth`   emits the synthesized CloudFormation template

## Dependencies

### Development Dependencies

- `@types/jest`: TypeScript definitions for Jest.
- `@types/node`: TypeScript definitions for Node.js.
- `aws-cdk`: AWS Cloud Development Kit.
- `jest`: JavaScript testing framework.
- `ts-jest`: Jest transformer for TypeScript.
- `ts-node`: TypeScript execution environment for node.
- `typescript`: TypeScript language support.

### Production Dependencies

- `@aws-cdk/aws-apprunner-alpha`: AWS CDK App Runner resources.
- `@cdklabs/cdk-ecs-codedeploy`: AWS CDK library for ECS CodeDeploy.
- `aws-cdk-lib`: AWS CDK standard library.
- `cdk-ecr-deployment`: AWS CDK construct library to deploy Docker images to ECR.
- `constructs`: Constructs programming model for CDK.
- `dotenv`: Loads environment variables from a `.env` file.
- `source-map-support`: Source map support for stack traces in node.

## License

This repository is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
