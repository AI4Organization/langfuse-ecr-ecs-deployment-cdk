import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { DockerEnvTyped } from '../../process-env-typed';
import { LangfuseEcrStackProps } from './LangfuseEcrStackProps';

export interface LangfuseEcsStackProps extends LangfuseEcrStackProps {
    /**
     * The port number on which the container service will be available.
     */
    readonly containerPort: number;
    /**
     * The Docker environment variables and run arguments.
     */
    readonly dockerRunArgs: DockerEnvTyped,
    /**
     * The ECR repository where the Docker images will be stored.
     */
    readonly ecrRepository: cdk.aws_ecr.Repository;
    /**
     * The VPC where the ECS services and other resources will be deployed.
     */
    readonly vpc: ec2.Vpc;

    readonly dbServerSG: cdk.aws_ec2.SecurityGroup;
}
