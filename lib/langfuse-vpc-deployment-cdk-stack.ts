import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as logs from "aws-cdk-lib/aws-logs";
import { Construct } from 'constructs';
import { FlowLogTrafficType } from "aws-cdk-lib/aws-ec2";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { LangfuseEcrStackProps } from "./LangfuseEcrStackProps";

/**
 * Represents a CDK stack for deploying a VPC suitable for ECS deployments.
 * This stack creates a VPC with public and private subnets, NAT gateways,
 * and VPC flow logs for monitoring network traffic.
 */
export class LangfuseVpcDeploymentCdkStack extends cdk.NestedStack {
    public readonly vpc: ec2.Vpc;

    constructor(scope: Construct, id: string, props: LangfuseEcrStackProps) {
        super(scope, id, props);
        this.vpc = createVPC(this, props);

        // print out vpc id
        new cdk.CfnOutput(this, `${props.appName}-${props.environment}-${props.deployRegion}-vpc-id`, {
            value: this.vpc.vpcId,
            exportName: `${props.appName}-${props.environment}-${props.deployRegion}-vpc-id`,
            description: "VPC ID",
        });
    }
}

/**
 * Creates a VPC with public and private subnets, NAT gateways, and VPC flow logs.
 *
 * @param {cdk.Stack} stack - The parent CDK stack.
 * @param {LangfuseEcrStackProps} props - Properties for VPC creation.
 * @returns {ec2.Vpc} The created VPC.
 */
export function createVPC(stack: cdk.Stack, props: LangfuseEcrStackProps): ec2.Vpc {
    const vpcName = `${props.appName}-${props.environment}-${props.deployRegion}-VPC`;
    const vpc = new ec2.Vpc(stack, vpcName, {
        ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'), //IPs in Range - 65,536
        natGateways: 1,
        maxAzs: 3, // for high availability
        subnetConfiguration: [
            {
                name: `${props.appName}-${props.environment}-Public`,
                subnetType: ec2.SubnetType.PUBLIC,
                cidrMask: 24, //IPs in Range - 256
            },
            {
                name: `${props.appName}-${props.environment}-Private`,
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
                cidrMask: 24, //IPs in Range - 256
            },
            {
                name: `${props.appName}-${props.environment}-Isolated`,
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                cidrMask: 24, //IPs in Range - 256
            },
        ],
        vpcName,
    });
    vpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const vpcFlowLogRole = new iam.Role(stack, `${props.appName}-${props.environment}-RoleVpcFlowLogs`, {
        assumedBy: new iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
        managedPolicies: [
            iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchFullAccess"),
        ],
    });

    const vpcFlowLogGroup = new logs.LogGroup(stack, `${props.appName}-${props.environment}-VpcFlowLogGroup`, {
        retention: RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new logs.LogStream(stack, `${props.appName}-${props.environment}-VpcFlowLogStream`, {
        logGroup: vpcFlowLogGroup,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    new ec2.FlowLog(stack, `${props.appName}-${props.environment}-VpcFlowLog`, {
        resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
        destination: ec2.FlowLogDestination.toCloudWatchLogs(vpcFlowLogGroup, vpcFlowLogRole),
        trafficType: FlowLogTrafficType.ALL,
    });

    return vpc;
}
