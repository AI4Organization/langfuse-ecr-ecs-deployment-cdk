import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apprunner from '@aws-cdk/aws-apprunner-alpha';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Cpu, Memory } from '@aws-cdk/aws-apprunner-alpha';
import { LangfuseAppRunnerDeploymentStackProps } from './LangfuseAppRunnerDeploymentStackProps';

export class CdkAppRunnerWithVpcDeploymentStack3 extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: LangfuseAppRunnerDeploymentStackProps) {
        super(scope, id, props);

        const imageVersion = props.imageVersion;
        console.log(`imageVersion: ${imageVersion}`);

        const containerPort = props.containerPort;
        console.log(`containerPort: ${containerPort}`);

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

        const apprunnerService = new apprunner.Service(this, `${props.appName}-${props.environment}-AppRunner-Service`, {
            cpu: Cpu.ONE_VCPU,
            memory: Memory.TWO_GB,
            autoDeploymentsEnabled: true,
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
