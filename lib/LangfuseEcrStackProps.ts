import { LangfuseBaseStackProps } from './LangfuseBaseStackProps';

/**
 * Properties for the Qdrant Docker Image ECR Deployment CDK Stack.
 * This interface extends the base CDK StackProps and includes properties specific to the Qdrant Docker image deployment.
 */
export interface LangfuseEcrStackProps extends LangfuseBaseStackProps {
  /**
   * The name of the ECR repository where the Docker images will be stored.
   */
  readonly repositoryName: string;
  /**
   * The version tag for the Docker image to be deployed.
   */
  readonly imageVersion: string;
  /**
   * The platform string indicating the CPU architecture, e.g., 'arm' or 'x86_64'.
   */
  readonly platformString?: string | undefined;
}
