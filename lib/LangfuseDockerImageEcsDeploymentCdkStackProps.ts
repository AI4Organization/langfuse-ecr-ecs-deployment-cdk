import * as cdk from 'aws-cdk-lib';
import { DatabaseEnvTyped, DockerEnvTyped } from '../process-env-typed';
import { LangfuseDockerImageEcrDeploymentCdkStackProps } from './LangfuseDockerImageEcrDeploymentCdkStackProps';

export interface LangfuseDockerImageEcsDeploymentCdkStackProps extends LangfuseDockerImageEcrDeploymentCdkStackProps {
    /**
     * The Docker image version to be deployed.
     */
    readonly imageVersion: string;
    /**
     * The port number on which the container service will be available.
     */
    readonly containerPort: number;
    /**
     * The port number on which the database service will be available.
     */
    readonly databasePort: number;
    /**
     * The Docker environment variables and run arguments.
     */
    readonly dockerRunArgs: DockerEnvTyped,
    /**
     * The database environment variables and arguments.
     */
    readonly databaseArgs: DatabaseEnvTyped;
    /**
     * The ECR repository where the Docker images will be stored.
     */

    readonly ecrRepository: cdk.aws_ecr.Repository
}
