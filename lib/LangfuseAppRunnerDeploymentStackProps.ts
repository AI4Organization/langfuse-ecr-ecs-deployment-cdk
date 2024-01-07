import * as cdk from "aws-cdk-lib";
import { DockerEnvTyped } from "../process-env-typed";
import { LangfuseDockerImageEcrDeploymentCdkStackProps } from "./LangfuseDockerImageEcrDeploymentCdkStackProps";

export interface LangfuseAppRunnerDeploymentStackProps extends LangfuseDockerImageEcrDeploymentCdkStackProps{
    /**
     * The Docker environment variables and run arguments.
     */
    readonly dockerRunArgs: DockerEnvTyped,

    readonly containerPort: number;
    /**
     * The ECR repository where the Docker images will be stored.
     */
    readonly ecrRepository: cdk.aws_ecr.Repository;
}
