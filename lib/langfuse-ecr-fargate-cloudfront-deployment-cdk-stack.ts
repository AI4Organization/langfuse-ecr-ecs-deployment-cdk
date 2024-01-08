import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
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
export class CdkFargateCloudFrontWithVpcDeploymentStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: LangfuseEcsStackProps) {
        super(scope, id, props);

        const existingVpc = props.vpc;

        // define a cluster with spot instances, linux type
        const cluster = new ecs.Cluster(this, `${props.appName}-${props.environment}-2-DeploymentCluster`, {
            vpc: existingVpc,
            containerInsights: true,
            clusterName: `${props.appName}-${props.environment}-2-Cluster`,
        });

        // Task Role
        const taskRole = new iam.Role(this, `${props.appName}-${props.environment}-2-ecsTaskExecutionRole`, {
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
                sid: "AllowECRImagePull",
                effect: iam.Effect.ALLOW,
                actions: [
                    "ecr:GetAuthorizationToken",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources: ["*"],
            }
        ));

        const containerPort = props.containerPort;
        console.log(`containerPort: ${containerPort}`);

        // create a task definition with CloudWatch Logs
        const logDriver = new ecs.AwsLogDriver({ streamPrefix: `${props.appName}-${props.environment}-2-${props.platformString}` });

        // Instantiate Fargate Service with just cluster and image
        const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, `${props.appName}-${props.environment}-2-${props.platformString}-FargateService`, {
            cluster,
            taskImageOptions: {
                image: ecs.ContainerImage.fromEcrRepository(props.ecrRepository, props.imageVersion),
                taskRole,
                containerPort,
                environment: {
                    ...props.dockerRunArgs,
                },
                enableLogging: true,
                logDriver,
            },
            taskSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
            cpu: 1024,
            memoryLimitMiB: 2048,
            desiredCount: 1,
            publicLoadBalancer: true,
            platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
            runtimePlatform: {
                cpuArchitecture: props.platformString === `arm` ? ecs.CpuArchitecture.ARM64 : ecs.CpuArchitecture.X86_64,
                operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
            },
        });
        fargateService.targetGroup.healthCheck = {
            path: "/healthz"
        };
        // Custom header object
        const customHeaderName: string = "X-Verify-Origin";
        const customHeaderValue: string = `${props.appName}-${props.environment}-2-LangfuseCloudFrontDistribution`;

        // Create a CloudFront distribution
        const cloudfrontDistribution = new cloudfront.Distribution(this, `${props.appName}-${props.environment}-2-LangfuseCloudFrontDistribution`, {
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.SSL_V3,
            comment: "CloudFront distribution for Langfuse frontend application.",
            defaultBehavior: {
                origin: new origins.LoadBalancerV2Origin(fargateService.loadBalancer, {
                    protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
                    httpPort: 80,
                    originPath: "/",
                    customHeaders: { [customHeaderName]: customHeaderValue }
                }),
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
                originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_AND_CLOUDFRONT_2022,
                responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
                compress: false
            },
        });

        // Create deny rule for ALB
        // Add a rule to deny traffic if custom header is absent
        new elbv2.ApplicationListenerRule(this, `${props.appName}-${props.environment}-2-LangfuseApplicationListenerRule`, {
            listener: fargateService.listener,
            priority: 1,
            conditions: [elbv2.ListenerCondition.httpHeader(customHeaderName, [customHeaderValue])],
            action: elbv2.ListenerAction.forward([fargateService.targetGroup])
        });

        // Create redirect rule for ALB to CloudFront
        new elbv2.ApplicationListenerRule(this, `${props.appName}-${props.environment}-2-RedirectApplicationListenerRule`, {
            listener: fargateService.listener,
            priority: 2,
            conditions: [elbv2.ListenerCondition.pathPatterns(["*"])],
            action: elbv2.ListenerAction.redirect({
                host: cloudfrontDistribution.domainName,
                permanent: true,
                protocol: "HTTPS",
                port: "443",
            }),
        });

        // Setup AutoScaling policy
        const scaling = fargateService.service.autoScaleTaskCount({ maxCapacity: 2, minCapacity: 1 });
        scaling.scaleOnCpuUtilization(`${props.appName}-${props.environment}-2-CpuScaling`, {
            targetUtilizationPercent: 70,
            scaleInCooldown: cdk.Duration.seconds(60),
            scaleOutCooldown: cdk.Duration.seconds(60),
        });

        // print out fargateService load balancer url
        new cdk.CfnOutput(this, `${props.appName}-${props.environment}-2-${props.platformString}-FargateServiceLoadBalancerDNS`, {
            value: fargateService.loadBalancer.loadBalancerDnsName,
            exportName: `${props.appName}-${props.environment}-2-${props.platformString}-FargateServiceLoadBalancerDNS`,
        });

        // Output the CloudFront distribution URL
        new cdk.CfnOutput(this, `${props.appName}-${props.environment}-2-LangfuseHttpsURL`, {
            value: `https://${cloudfrontDistribution.domainName}`,
            exportName: `${props.appName}-${props.environment}-2-LangfuseHttpsURL`,
            description: "The URL of the CloudFront distribution.",
        });
    }
}
