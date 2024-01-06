import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Cpu, Memory } from '@aws-cdk/aws-apprunner-alpha';
import { LangfuseDockerImageEcsDeploymentCdkStackProps } from './LangfuseDockerImageEcsDeploymentCdkStackProps';

/**
 * Represents a CDK stack for deploying an AWS App Runner service within a VPC.
 * This stack creates an App Runner service with a VPC connector for network isolation
 * and sets up the necessary security groups and roles.
 *
 * @class CdkAppRunnerWithVpcDeploymentStack
 * @extends {cdk.NestedStack}
 */
export class CdkAppRunnerWithVpcDeploymentStack extends cdk.NestedStack {
  constructor(scope: Construct, id: string, props: LangfuseDockerImageEcsDeploymentCdkStackProps) {
    super(scope, id, props);

    const langfuseVpc = props.vpc;

    const httpSG = new ec2.SecurityGroup(this, `${props.appName}-${props.environment}-${props.platformString}-HttpSG`, {
      vpc: langfuseVpc,
      allowAllOutbound: true,
    });

    httpSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80)
    );

    const httpsSG = new ec2.SecurityGroup(this, `${props.appName}-${props.environment}-${props.platformString}-HttpsSG`, {
      vpc: langfuseVpc,
      allowAllOutbound: true,
    });

    httpsSG.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443)
    );

    const vpcConnector = new apprunner.VpcConnector(this, `${props.appName}-${props.environment}-VpcConnector`, {
      vpc: langfuseVpc,
      vpcSubnets: langfuseVpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }),
      securityGroups: [httpSG, httpsSG],
    });

    // define apprunner role to access ecr
    const appRunnerRole = new iam.Role(
      this,
      `${props.appName}-${props.environment}-apprunner-role`,
      {
        assumedBy: new iam.ServicePrincipal("build.apprunner.amazonaws.com"),
        description: `${props.appName}-${props.environment}-apprunner-role`,
        inlinePolicies: {
          apprunnerpolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ["ecr:GetAuthorizationToken"],
                resources: ["*"],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  "ecr:BatchCheckLayerAvailability",
                  "ecr:GetDownloadUrlForLayer",
                  "ecr:GetRepositoryPolicy",
                  "ecr:DescribeRepositories",
                  "ecr:ListImages",
                  "ecr:DescribeImages",
                  "ecr:BatchGetImage",
                  "ecr:GetLifecyclePolicy",
                  "ecr:GetLifecyclePolicyPreview",
                  "ecr:ListTagsForResource",
                  "ecr:DescribeImageScanFindings",
                ],
                resources: [props.ecrRepository.repositoryArn],
              }),
            ],
          }),
        },
        roleName: `${props.appName}-${props.environment}-apprunner-role`,
      }
    );

    const imageVersion = props.imageVersion;
    console.log(`imageVersion: ${imageVersion}`);

    const containerPort = props.containerPort;
    const apprunnerService = new apprunner.Service(this, `${props.appName}-${props.environment}-${props.platformString}-AppRunner-Service`, {
      cpu: Cpu.ONE_VCPU,
      memory: Memory.TWO_GB,
      autoDeploymentsEnabled: true,
      vpcConnector,
      source: apprunner.Source.fromEcr({
        repository: props.ecrRepository,
        tag: imageVersion,
        imageConfiguration: {
          port: containerPort,
          environmentVariables: {
            ...props.dockerRunArgs,
            DATABASE_URL: props.DATABASE_URL,
          },
        }
      }),
      accessRole: appRunnerRole,
      serviceName: `${props.appName}-${props.environment}-${props.platformString}-AppRunner-Service`,
    });

    // print out apprunnerService url
    new cdk.CfnOutput(this, `${props.appName}-${props.environment}-${props.platformString}-AppRunner-Service-Url-With-Vpc`, {
      value: `https://${apprunnerService.serviceUrl}`,
      exportName: `${props.appName}-${props.environment}-${props.platformString}-AppRunner-Service-Url-With-Vpc`,
    });
  }
}

// Continue @ https://github.com/aws-samples/aws-apprunner-cdk/blob/main/cdk/lib/cdk-infra-stack.ts