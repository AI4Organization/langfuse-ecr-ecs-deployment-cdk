import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { DatabaseEnvTyped } from '../../process-env-typed';
import { LangfuseEcrStackProps } from './LangfuseEcrStackProps';

export interface LangfusePostgresStackProps extends LangfuseEcrStackProps {
    /**
     * The database environment variables and arguments.
     */
    readonly databaseArgs: DatabaseEnvTyped;
    /**
     * The VPC where the ECS services and other resources will be deployed.
     */
    readonly vpc: ec2.Vpc;
}
