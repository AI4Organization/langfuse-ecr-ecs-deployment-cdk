import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { checkEnvVariables } from '../utils/check-environment-variable';
import { LangfuseEcrDeploymentCdkStack } from './langfuse-ecr-deployment-cdk-stack';
import { IEnvTypes } from '../process-env-typed';
import { LangfuseBaseStackProps } from './LangfuseBaseStackProps';
import { LangfuseVpcDeploymentCdkStack } from './langfuse-vpc-deployment-cdk-stack';
import { LangfuseDockerImageEcrDeploymentCdkStackProps } from './LangfuseDockerImageEcrDeploymentCdkStackProps';
import { LangfuseDockerImageEcsDeploymentCdkStackProps } from './LangfuseDockerImageEcsDeploymentCdkStackProps';
import { LangfusePostgresStackProps } from './LangfusePostgresStackProps';
import { CdkPostgreSQLDeploymentStack } from './langfuse-postgres-deployment-cdk-stack';

export class CdkLangfuseEcrEcsDeploymentStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: LangfuseBaseStackProps) {
        super(scope, id, props);

        // check general stack props
        checkEnvVariables('ECR_REPOSITORY_NAME', 'APP_NAME', 'IMAGE_VERSION', 'PORT');

        const envTyped: IEnvTypes = {
            ECR_REPOSITORY_NAME: process.env.ECR_REPOSITORY_NAME!,
            APP_NAME: process.env.APP_NAME!,
            IMAGE_VERSION: process.env.IMAGE_VERSION!,
            PORT: process.env.PORT!,
        };

        const ecrStackProps: LangfuseDockerImageEcrDeploymentCdkStackProps = {
            repositoryName: envTyped.ECR_REPOSITORY_NAME,
            appName: envTyped.APP_NAME,
            imageVersion: envTyped.IMAGE_VERSION,
            environment: props.environment,
            deployRegion: props.deployRegion,
            stackName: `${envTyped.APP_NAME}-${props.environment}-${props.deployRegion}-LangfuseEcrDeploymentCdkStack`,
        };

        const ecrStack = new LangfuseEcrDeploymentCdkStack(this, `${envTyped.APP_NAME}-${props.environment}-${props.deployRegion}-LangfuseEcrDeploymentCdkStack`, ecrStackProps);

        const vpcStack = new LangfuseVpcDeploymentCdkStack(this, `${envTyped.APP_NAME}-${props.environment}-${props.deployRegion}-LangfuseVpcDeploymentCdkStack`, ecrStackProps);

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

        const postgresStack = new CdkPostgreSQLDeploymentStack(this, `${envTyped.APP_NAME}-${props.environment}-${props.deployRegion}-CdkPostgreSQLDeploymentStack`, postgresStackProps);
    }
}
