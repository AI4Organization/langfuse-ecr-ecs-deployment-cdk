import { DatabaseEnvTyped, DockerEnvTyped } from '../process-env-typed';
import { LangfuseDockerImageEcrDeploymentCdkStackProps } from './LangfuseDockerImageEcrDeploymentCdkStackProps';

export interface LangfuseDockerImageEcsDeploymentCdkStackProps extends LangfuseDockerImageEcrDeploymentCdkStackProps {
    /**
     * The port number on which the container service will be available.
     */
    readonly containerPort: number;
    /**
     * The port number on which the database service will be available.
     */
    readonly databasePort: number;
    /**
     * The Docker environment variables and run arguments.
     */
    readonly dockerRunArgs: DockerEnvTyped,


    readonly databaseArgs: DatabaseEnvTyped;
}
