import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { LangfuseEcsStackProps } from './LangfuseEcsStackProps';

export class CdkFargateWithVpcDeploymentStack extends cdk.NestedStack {
    constructor(scope: Construct, id: string, props: LangfuseEcsStackProps) {
        super(scope, id, props);

        const existingVpc = props.vpc;
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

        // define a cluster with spot instances, linux type
        const cluster = new ecs.Cluster(this, `DeploymentCluster`, {
            vpc: existingVpc,
            containerInsights: true,
            clusterName: `${props.appName}-${props.environment}-Cluster`,
        });

        // Task Role
        const taskRole = new iam.Role(this, "ecsTaskExecutionRole", {
            assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
        });

        taskRole.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName(
                "service-role/AmazonECSTaskExecutionRolePolicy"
            )
        );

        const containerPort = props.containerPort;
        console.log(`containerPort: ${containerPort}`);

        // create a task definition with CloudWatch Logs
        const logDriver = new ecs.AwsLogDriver({ streamPrefix: `${props.appName}-${props.environment}-${props.platformString}` });

        // const certificate = new Certificate(this, `${props.appName}-${props.environment}-Certificate`, {
        //     domainName: 'example.com',
        //     subjectAlternativeNames: ['*.example.com'],
        //     validation: CertificateValidation.fromDns(),
        // });

        // Instantiate Fargate Service with just cluster and image
        const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "FargateService", {
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
            securityGroups: [httpSG, httpsSG],
            // certificate: acm.Certificate.fromCertificateArn(this, `${props.appName}-${props.environment}-FargateServiceCertificate`, props.certificateArn),
            // certificate,
            // redirectHTTP: true,
            cpu: 1024,
            memoryLimitMiB: 2048,
            desiredCount: 1,
            publicLoadBalancer: true,
            platformVersion: ecs.FargatePlatformVersion.VERSION1_4,
            runtimePlatform: {
                // cpuArchitecture: props.platformString === `arm` ? ecs.CpuArchitecture.ARM64 : ecs.CpuArchitecture.X86_64,
                cpuArchitecture: ecs.CpuArchitecture.X86_64,
                operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
            },
        });

        // Setup AutoScaling policy
        const scaling = fargateService.service.autoScaleTaskCount({ maxCapacity: 2, minCapacity: 1 });
        scaling.scaleOnCpuUtilization(`${props.appName}-${props.environment}-CpuScaling`, {
            targetUtilizationPercent: 70,
            scaleInCooldown: cdk.Duration.seconds(60),
            scaleOutCooldown: cdk.Duration.seconds(60)
        });

        // print out fargateService load balancer url
        new cdk.CfnOutput(this, `${props.appName}-${props.environment}-FargateServiceLoadBalancerDNS`, {
            value: fargateService.loadBalancer.loadBalancerDnsName,
            exportName: `${props.appName}-${props.environment}-FargateServiceLoadBalancerDNS`,
        });
    }
}