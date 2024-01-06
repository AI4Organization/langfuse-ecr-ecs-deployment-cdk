import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { checkEnvVariables } from '../utils/check-environment-variable';
import { LangfuseEcrDeploymentCdkStack } from './langfuse-ecr-deployment-cdk-stack';
import { IEnvTypes } from '../process-env-typed';
import { LangfuseBaseStackProps } from './LangfuseBaseStackProps';
import { LangfuseVpcDeploymentCdkStack } from './langfuse-vpc-deployment-cdk-stack';
import { LangfuseDockerImageEcrDeploymentCdkStackProps } from './LangfuseDockerImageEcrDeploymentCdkStackProps';
import { LangfusePostgresStackProps } from './LangfusePostgresStackProps';
import { CdkPostgreSQLDeploymentStack } from './langfuse-postgres-deployment-cdk-stack';
import { CdkAppRunnerWithVpcDeploymentStack } from './langfuse-ecr-apprunner-deployment-cdk-stack';
import { CdkAppRunnerWithVpcDeploymentStackProps } from './LangfuseAppRunnerWithVpcDeploymentStackProps';

/**
 * Represents a CDK stack for deploying Langfuse ECR and ECS resources.
 *
 * This stack is responsible for setting up the necessary AWS resources for
 * storing Docker images in ECR and running them within ECS. It includes
 * the creation of an ECR repository, a VPC, a PostgreSQL database, and
 * the deployment of the application using AWS App Runner.
 *
 * @extends cdk.Stack
 */
export class CdkLangfuseEcrEcsDeploymentStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: LangfuseBaseStackProps) {
        super(scope, id, props);

        const envTyped: IEnvTypes = props.envTyped;

        const ecrStackProps: LangfuseDockerImageEcrDeploymentCdkStackProps = {
            repositoryName: envTyped.ECR_REPOSITORY_NAME,
            appName: envTyped.APP_NAME,
            imageVersion: envTyped.IMAGE_VERSION,
            environment: props.environment,
            deployRegion: props.deployRegion,
            stackName: `${envTyped.APP_NAME}-${props.environment}-${props.deployRegion}-LangfuseEcrDeploymentCdkStack`,
        };

        const ecrStack = new LangfuseEcrDeploymentCdkStack(this, `${envTyped.APP_NAME}-${props.environment}-${props.deployRegion}-LangfuseEcrDeploymentCdkStack`, {
            ...ecrStackProps,
            stackName: `${envTyped.APP_NAME}-${props.environment}-${props.deployRegion}-LangfuseEcrDeploymentCdkStack`,
            description: `Langfuse ECR deployment stack for ${props.environment} environment in ${props.deployRegion} region.`,
        });

        const vpcStack = new LangfuseVpcDeploymentCdkStack(this, `${envTyped.APP_NAME}-${props.environment}-${props.deployRegion}-LangfuseVpcDeploymentCdkStack`, {
            ...ecrStackProps,
            stackName: `${envTyped.APP_NAME}-${props.environment}-${props.deployRegion}-LangfuseVpcDeploymentCdkStack`,
            description: `Langfuse VPC deployment stack for ${props.environment} environment in ${props.deployRegion} region.`,
        });

        const postgresStackProps: LangfusePostgresStackProps = {
            ...ecrStackProps,
            vpc: vpcStack.vpc,
            databaseArgs: {
                POSTGRES_USER: process.env.POSTGRES_USER!,
                POSTGRES_PASSWORD: process.env.POSTGRES_PASSWORD!,
                POSTGRES_DB: process.env.POSTGRES_DB!,
                DB_PORT: process.env.DB_PORT!,
            },
        };

        const postgresStack = new CdkPostgreSQLDeploymentStack(this, `${envTyped.APP_NAME}-${props.environment}-${props.deployRegion}-CdkPostgreSQLDeploymentStack`, {
            ...postgresStackProps,
            stackName: `${envTyped.APP_NAME}-${props.environment}-${props.deployRegion}-CdkPostgreSQLDeploymentStack`,
            description: `Langfuse PostgreSQL deployment stack for ${props.environment} environment in ${props.deployRegion} region.`,
        });

        // check docker env variables
        checkEnvVariables('NODE_ENV', 'NEXTAUTH_SECRET', 'SALT', 'TELEMETRY_ENABLED', 'NEXTAUTH_URL', 'NEXT_PUBLIC_SIGN_UP_DISABLED', 'LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES');

        const appRunnerStackProps: CdkAppRunnerWithVpcDeploymentStackProps = {
            ...ecrStackProps,
            ...postgresStackProps,
            containerPort: parseInt(envTyped.PORT),
            dockerRunArgs: {
                NODE_ENV: process.env.NODE_ENV!,
                NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
                SALT: process.env.SALT!,
                TELEMETRY_ENABLED: process.env.TELEMETRY_ENABLED!, // todo change to boolean
                NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
                NEXT_PUBLIC_SIGN_UP_DISABLED: process.env.NEXT_PUBLIC_SIGN_UP_DISABLED!, // todo change to boolean
                LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES: process.env.LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES!, // todo change to boolean
                // DATABASE_URL: postgresStack.DATABASE_URL, // TODO test with free postgres via https://www.elephantsql.com/
                DATABASE_URL: `postgres://zuoznelq:GGMIjVd0kyqG5K9uZMR21ya_qz7X3kX9@pom.db.elephantsql.com/zuoznelq`,
            },
            ecrRepository: ecrStack.ecrRepository,
            dbServerSG: postgresStack.dbServerSG,
        };

        new CdkAppRunnerWithVpcDeploymentStack(this, `${envTyped.APP_NAME}-${props.environment}-${props.deployRegion}-CdkAppRunnerWithVpcDeploymentStack`, {
            ...appRunnerStackProps,
            stackName: `${envTyped.APP_NAME}-${props.environment}-${props.deployRegion}-CdkAppRunnerWithVpcDeploymentStack`,
            description: `Langfuse App Runner deployment stack for ${props.environment} environment in ${props.deployRegion} region.`,
        });
    }
}
