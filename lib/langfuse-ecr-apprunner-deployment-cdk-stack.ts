import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Cpu, Memory } from '@aws-cdk/aws-apprunner-alpha';
import { LangfuseDockerImageEcsDeploymentCdkStackProps } from './LangfuseDockerImageEcsDeploymentCdkStackProps';
import { createVPC } from './langfuse-vpc-deployment';

export class CdkAppRunnerWithVpcDeploymentStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: LangfuseDockerImageEcsDeploymentCdkStackProps) {
    super(scope, id, props);

    const langfuseVpc = createVPC(this, props);

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

    const ecrRepositoryName = props.repositoryName;
    console.log(`ecrRepositoryName: ${ecrRepositoryName}`);

    const imageVersion = props.imageVersion;
    console.log(`imageVersion: ${imageVersion}`);

    const ecrRepository = ecr.Repository.fromRepositoryName(this, `${props.environment}-${props.platformString}-${props.deployRegion}-ERCRepository`, ecrRepositoryName);

    const containerPort = props.containerPort;
    const apprunnerService = new apprunner.Service(this, `${props.appName}-${props.environment}-${props.platformString}-AppRunner-Service`, {
      cpu: Cpu.ONE_VCPU,
      memory: Memory.TWO_GB,
      autoDeploymentsEnabled: true,
      vpcConnector,
      source: apprunner.Source.fromEcr({
        repository: ecrRepository,
        tag: imageVersion,
        imageConfiguration: {
          port: containerPort,
          environmentVariables: {
            ...props.dockerRunArgs
          },
        }
      }),
    });

    // print out apprunnerService url
    new cdk.CfnOutput(this, `${props.appName}-${props.environment}-${props.platformString}-AppRunner-Service-Url-With-Vpc`, {
      value: `https://${apprunnerService.serviceUrl}`,
      exportName: `${props.appName}-${props.environment}-${props.platformString}-AppRunner-Service-Url-With-Vpc`,
    });
  }
}
