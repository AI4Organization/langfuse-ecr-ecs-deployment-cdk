import { DockerEnvTyped } from '../process-env-typed';
import { LangfuseDockerImageEcrDeploymentCdkStackProps } from './LangfuseDockerImageEcrDeploymentCdkStackProps';

export interface LangfuseDockerImageEcsDeploymentCdkStackProps extends LangfuseDockerImageEcrDeploymentCdkStackProps {
    /**
     * The platform string indicating the CPU architecture, e.g., 'arm' or 'x86_64'.
     */
    readonly platformString: string;
    /**
     * The port number on which the container service will be available.
     */
    readonly containerPort: number;
    /**
     * The AWS region where the deployment will occur. This is optional and can be undefined.
     */
    readonly deployRegion: string | undefined;
    /**
     * The port number on which the database service will be available.
     */
    readonly databasePort: number;
    /**
     * The Docker environment variables and run arguments.
     */
    readonly dockerRunArgs: DockerEnvTyped,
}
