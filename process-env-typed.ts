export interface IEnvTypes {
    /**
     * Name of the ECR repository where the Docker images are stored.
     */
    readonly ECR_REPOSITORY_NAME: string;
    /**
     * Name of the application that is being deployed.
     */
    readonly APP_NAME: string;
    /**
     * Optional version tag for the Docker image.
     */
    readonly IMAGE_VERSION?: string;
    /**
     * Comma-separated list of platforms for which the Docker image is built.
     * Example: "linux/amd64,linux/arm64"
     */
    readonly PLATFORMS: string;
    /**
     * Port number on which the application will run.
     */
    PORT: string;
}
