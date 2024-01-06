import * as cdk from "aws-cdk-lib";
import { LangfuseDockerImageEcsDeploymentCdkStackProps } from "./LangfuseDockerImageEcsDeploymentCdkStackProps";

export interface CdkAppRunnerWithVpcDeploymentStackProps extends LangfuseDockerImageEcsDeploymentCdkStackProps{
    readonly dbServerSG: cdk.aws_ec2.SecurityGroup;
}
