import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Cpu, Memory } from '@aws-cdk/aws-apprunner-alpha';
import { DockerImageAsset } from 'aws-cdk-lib/aws-ecr-assets';
import { CdkAppRunnerWithVpcDeploymentStackProps } from './LangfuseAppRunnerWithVpcDeploymentStackProps';

export class CdkAppRunnerWithVpcDeploymentStack2 extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: CdkAppRunnerWithVpcDeploymentStackProps) {
        super(scope, id, props);

        const vpcId = 'vpc-0ffd7f1fb776cf495';
        // const existingVpc = props.vpc;
        const existingVpc = ec2.Vpc.fromLookup(this, `${props.appName}-${props.environment}-VPC`, {
            vpcId,
        });

        const httpSG = new ec2.SecurityGroup(this, `${props.appName}-${props.environment}-HttpSG`, {
            vpc: existingVpc,
            allowAllOutbound: true,
        });

        httpSG.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(80)
        );

        const httpsSG = new ec2.SecurityGroup(this, `${props.appName}-${props.environment}-HttpsSG`, {
            vpc: existingVpc,
            allowAllOutbound: true,
        });
        httpsSG.addIngressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(443)
        );

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

        const vpcConnector = new apprunner.VpcConnector(this, `${props.appName}-${props.environment}-VpcConnector`, {
            vpc: existingVpc,
            vpcSubnets: existingVpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }),
            securityGroups: [httpSG, httpsSG],
        });

        const imageVersion = props.imageVersion;
        console.log(`imageVersion: ${imageVersion}`);

        const containerPort = props.containerPort;
        console.log(`containerPort: ${containerPort}`);

        console.log(`props.dockerRunArgs: ${JSON.stringify(props.dockerRunArgs)}`);

        const apprunnerService = new apprunner.Service(this, `${props.appName}-${props.environment}-AppRunner-Service`, {
            cpu: Cpu.ONE_VCPU,
            memory: Memory.TWO_GB,
            autoDeploymentsEnabled: true,
            vpcConnector,
            source: apprunner.Source.fromEcr({
                repository: props.ecrRepository,
                tagOrDigest: imageVersion,
                imageConfiguration: {
                    port: containerPort,
                    environmentVariables: {
                        ...props.dockerRunArgs,
                    },
                },
            }),
            accessRole: appRunnerRole,
        });

        // print out apprunnerService url
        new cdk.CfnOutput(this, `${props.appName}-${props.environment}-AppRunner-Service-Url-With-Vpc`, {
            value: `https://${apprunnerService.serviceUrl}`,
            exportName: `${props.appName}-${props.environment}-AppRunner-Service-Url-With-Vpc`,
        });
    }
}
