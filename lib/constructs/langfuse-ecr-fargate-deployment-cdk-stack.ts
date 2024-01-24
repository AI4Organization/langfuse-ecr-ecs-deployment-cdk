import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {
    AllowedMethods,
    CachePolicy,
    Distribution,
    Function,
    FunctionCode,
    FunctionEventType,
    OriginProtocolPolicy,
    OriginRequestCookieBehavior,
    OriginRequestHeaderBehavior,
    OriginRequestPolicy,
    OriginRequestQueryStringBehavior,
    ResponseHeadersPolicy,
    SecurityPolicyProtocol,
} from "aws-cdk-lib/aws-cloudfront";
import { LoadBalancerV2Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { LangfuseEcsStackProps } from './LangfuseEcsStackProps';

/**
 * Represents a CDK stack for deploying a Fargate service within a VPC.
 *
 * This stack sets up the necessary AWS resources to deploy a containerized
 * application using AWS Fargate. It includes setting up an ECS cluster,
 * task definitions, security groups, and an Application Load Balancer.
 * The stack also configures auto-scaling for the Fargate service based on CPU utilization.
 *
 * @param {Construct} scope - The parent construct.
 * @param {string} id - The unique identifier for the stack.
 * @param {LangfuseEcsStackProps} props - The properties for the Fargate deployment stack.
 */
export class CdkFargateWithVpcDeploymentStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: LangfuseEcsStackProps) {
        super(scope, id, props);

        const containerPort = props.containerPort;
        console.log(`containerPort: ${containerPort}`);

        const existingVpc = props.vpc;

        const loadBalancerSecurityGroup = new ec2.SecurityGroup(this, `${props.appName}-${props.environment}-${props.platformString}-Langfuse-ALB-SecGrp`, { vpc: existingVpc });
        loadBalancerSecurityGroup.addIngressRule(ec2.Peer.ipv4('0.0.0.0/0'), ec2.Port.tcp(80)); // allow all inbound traffic on port 80

        const ecsSecurityGroup = new ec2.SecurityGroup(this, 'Langfuse-ECS-SecurityGroup', { vpc: existingVpc, allowAllOutbound: true });
        ecsSecurityGroup.addIngressRule(loadBalancerSecurityGroup, ec2.Port.tcp(80));
        ecsSecurityGroup.addIngressRule(loadBalancerSecurityGroup, ec2.Port.tcp(containerPort));
        ecsSecurityGroup.addIngressRule(ecsSecurityGroup, ec2.Port.allTraffic());

        // todo add egress rule to allow outbound traffic to postgres db from fargate

        // define a cluster with spot instances, linux type
        const cluster = new ecs.Cluster(this, `${props.appName}-${props.environment}-${props.platformString}-DeploymentCluster`, {
            vpc: existingVpc,
            containerInsights: true,
            clusterName: `${props.appName}-${props.environment}-Cluster`,
        });

        // Task Role
        const taskRole = new iam.Role(this, `${props.appName}-${props.environment}-${props.platformString}-ecsTaskExecutionRole`, {
            assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        });

        // Add permissions to the Task Role
        taskRole.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName(
                "service-role/AmazonECSTaskExecutionRolePolicy"
            )
        );

        // Add permissions to the Task Role to allow it to pull images from ECR
        taskRole.addToPolicy(new iam.PolicyStatement(
            {
                effect: iam.Effect.ALLOW,
                actions: [
                    "ecr:GetAuthorizationToken",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources: [props.ecrRepository.repositoryArn],
            }
        ));

        const loadBalancer = new elbv2.ApplicationLoadBalancer(
            this,
            `${props.appName}-${props.environment}-${props.platformString}-LangfuseLoadBalancer`,
            {
                vpc: props.vpc,
                securityGroup: loadBalancerSecurityGroup,
                internetFacing: true,
            }
        );

        // create a task definition with CloudWatch Logs
        const logDriver = new ecs.AwsLogDriver({ streamPrefix: `${props.appName}-${props.environment}-${props.platformString}` });

        // Instantiate Fargate Service with just cluster and image
        const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, `${props.appName}-${props.environment}-${props.platformString}-FargateService`, {
            cluster,
            taskImageOptions: {
                image: ecs.ContainerImage.fromEcrRepository(props.ecrRepository, props.imageVersion),
                taskRole,
                containerPort,
                enableLogging: true,
                logDriver,
            },
            loadBalancer,
            securityGroups: [ecsSecurityGroup],
            cpu: 1024,
            memoryLimitMiB: 2048,
            desiredCount: 1,
            platformVersion: ecs.FargatePlatformVersion.LATEST,
            runtimePlatform: {
                cpuArchitecture: props.platformString === `arm` ? ecs.CpuArchitecture.ARM64 : ecs.CpuArchitecture.X86_64,
                operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
            },
        });

        // Setup AutoScaling policy
        const scaling = fargateService.service.autoScaleTaskCount({ maxCapacity: 2, minCapacity: 1 });
        scaling.scaleOnCpuUtilization(`${props.appName}-${props.environment}-${props.platformString}-CpuScaling`, {
            targetUtilizationPercent: 70,
            scaleInCooldown: cdk.Duration.seconds(60),
            scaleOutCooldown: cdk.Duration.seconds(60)
        });

        fargateService.targetGroup.configureHealthCheck({
            path: "/",
            interval: cdk.Duration.seconds(60),
            healthyHttpCodes: "200-499", // We have to check for 401 as the default state of "/" is unauthenticated
        });

        // Cloudfront Distribution
        const langfuseOriginRequestPolicy = new OriginRequestPolicy(
            this,
            `${props.appName}-${props.environment}-${props.platformString}-OriginRequestPolicy`,
            {
                originRequestPolicyName: "LangfusePolicy",
                comment: "Policy optimised for Langfuse",
                cookieBehavior: OriginRequestCookieBehavior.all(),
                headerBehavior: OriginRequestHeaderBehavior.all(),
                queryStringBehavior: OriginRequestQueryStringBehavior.all(),
            }
        );

        /** Fixes Cors Issue */
        const corsFunction = new Function(this, `${props.appName}-${props.environment}-${props.platformString}-CorsFunction`, {
            code: FunctionCode.fromInline(`
                function handler(event) {
                    if(event.request.method === 'OPTIONS') {
                        var response = {
                            statusCode: 204,
                            statusDescription: 'OK',
                            headers: {
                                'access-control-allow-origin': { value: '*' },
                                'access-control-allow-headers': { value: '*' }
                            }
                        };
                        return response;
                    }
                    return event.request;
                }
            `),
        });

        const langfuseDistribution = new Distribution(this, `${props.appName}-${props.environment}-${props.platformString}-LangfuseDistribution`, {
            defaultBehavior: {
                origin: new LoadBalancerV2Origin(loadBalancer, {
                    protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
                }),
                originRequestPolicy: langfuseOriginRequestPolicy,
                responseHeadersPolicy: ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
                cachePolicy: CachePolicy.CACHING_DISABLED,
                allowedMethods: AllowedMethods.ALLOW_ALL,
                compress: true,
                viewerProtocolPolicy: cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                functionAssociations: [
                    {
                        function: corsFunction,
                        eventType: FunctionEventType.VIEWER_REQUEST,
                    },
                ],
            },
            minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
            comment: "CloudFront distribution for Langfuse frontend application.",
        });

        new cdk.CfnOutput(this, `${props.appName}-${props.environment}-${props.platformString}-LangfuseURL`, {
            value: `https://${langfuseDistribution.distributionDomainName}`,
            description: "Langfuse CloudFront Distribution URL.",
            exportName: `${props.appName}-${props.environment}-${props.platformString}-LangfuseDistributionURL`,
        });
    }
}
