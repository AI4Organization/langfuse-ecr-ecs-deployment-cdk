import * as cdk from 'aws-cdk-lib';

export interface LangfuseBaseStackProps extends cdk.StackProps {
    /**
     * The deployment environment (e.g., 'development', 'production').
     */
    readonly environment: string;
    /**
     * The AWS region where the deployment will occur. This is optional and can be undefined.
     */
    readonly deployRegion: string | undefined;
}
