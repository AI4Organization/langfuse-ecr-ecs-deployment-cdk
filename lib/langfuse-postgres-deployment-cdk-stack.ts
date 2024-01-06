import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from "aws-cdk-lib/aws-rds";
import { LangfusePostgresStackProps } from './LangfusePostgresStackProps';

/**
 * Represents a CDK stack for deploying a PostgreSQL database instance.
 * This stack creates an RDS PostgreSQL instance with the necessary configurations
 * and security groups for secure access within a VPC.
 */
export class CdkPostgreSQLDeploymentStack extends cdk.NestedStack {
    public DATABASE_URL: string;

    constructor(scope: Construct, id: string, props: LangfusePostgresStackProps) {
        super(scope, id, props);
        const langfuseVpc = props.vpc;

        // database security group
        const dbServerSG = new ec2.SecurityGroup(this, `${props.appName}-${props.environment}-rds-sg`, {
            vpc: langfuseVpc,
            allowAllOutbound: true,
            description: "Ingress for PostgreSQL database access.",
        });

        const databasePort = parseInt(props.databaseArgs.DB_PORT);
        dbServerSG.addIngressRule(
            ec2.Peer.ipv4(langfuseVpc.vpcCidrBlock),
            ec2.Port.tcp(databasePort),
            "Allow database access from within VPC."
        );

        // define postgresql database
        const postgresDatabaseInstance = new rds.DatabaseInstance(
            this,
            `${props.appName}-${props.environment}-postgres-rds`,
            {
                engine: rds.DatabaseInstanceEngine.postgres({
                    version: rds.PostgresEngineVersion.VER_16_1,
                }),
                instanceType: ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.SMALL
                ),
                credentials: rds.Credentials.fromUsername(props.databaseArgs.POSTGRES_USER, {
                    password: cdk.SecretValue.unsafePlainText(props.databaseArgs.POSTGRES_PASSWORD),
                }),
                vpc: langfuseVpc,
                vpcSubnets: {
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                },
                autoMinorVersionUpgrade: false,
                allowMajorVersionUpgrade: false,
                securityGroups: [dbServerSG],
                multiAz: true,
                backupRetention: cdk.Duration.days(5),
                removalPolicy: cdk.RemovalPolicy.DESTROY,
                storageEncrypted: true,
                databaseName: props.databaseArgs.POSTGRES_DB,
            }
        );

        const dbHostName = postgresDatabaseInstance.instanceEndpoint.hostname;
        this.DATABASE_URL = `postgresql://${props.databaseArgs.POSTGRES_USER}:${props.databaseArgs.POSTGRES_PASSWORD}@${dbHostName}:${props.databaseArgs.DB_PORT}/${props.databaseArgs.POSTGRES_DB}?createDatabaseIfNotExist=true`;

        const dbInstanceEndpointAddress = postgresDatabaseInstance.dbInstanceEndpointAddress;
        const dbInstanceEndpointPort = postgresDatabaseInstance.dbInstanceEndpointPort;

        // print out postgresDatabaseInstance endpoint
        new cdk.CfnOutput(this, `${props.appName}-${props.environment}-${props.deployRegion}-PostgresDatabaseInstanceEndpoint`, {
            value: postgresDatabaseInstance.instanceEndpoint.hostname,
            exportName: `${props.appName}-${props.environment}-${props.deployRegion}-PostgresDatabaseInstanceEndpoint`,
            description: "PostgreSQL database instance endpoint.",
        });

        // print out DATABASE_URL
        new cdk.CfnOutput(this, `${props.appName}-${props.environment}-${props.deployRegion}-DATABASE-URL`, {
            value: this.DATABASE_URL,
            exportName: `${props.appName}-${props.environment}-${props.deployRegion}-DATABASE-URL`,
            description: "PostgreSQL database URL.",
        });

        // print out dbInstanceEndpointAddress
        new cdk.CfnOutput(this, `${props.appName}-${props.environment}-${props.deployRegion}-dbInstanceEndpointAddress`, {
            value: dbInstanceEndpointAddress,
            exportName: `${props.appName}-${props.environment}-${props.deployRegion}-dbInstanceEndpointAddress`,
            description: "PostgreSQL database instance endpoint address.",
        });

        // print out dbInstanceEndpointPort
        new cdk.CfnOutput(this, `${props.appName}-${props.environment}-${props.deployRegion}-dbInstanceEndpointPort`, {
            value: dbInstanceEndpointPort.toString(),
            exportName: `${props.appName}-${props.environment}-${props.deployRegion}-dbInstanceEndpointPort`,
            description: "PostgreSQL database instance endpoint port.",
        });
    }
}
