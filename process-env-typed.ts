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
    /**
     * Port number of the databse will run.
     */
    DB_PORT: string;
}

export interface DockerEnvTyped {
    readonly NODE_ENV: string;
    readonly DATABASE_URL: string;
    readonly NEXTAUTH_SECRET: string;
    readonly SALT: string;
    readonly NEXTAUTH_URL: string;
    readonly TELEMETRY_ENABLED: string;
    readonly NEXT_PUBLIC_SIGN_UP_DISABLED: string;
    readonly LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES: string;
}

export interface DatabaseEnvTyped {
    readonly POSTGRES_USER: string;
    readonly POSTGRES_PASSWORD: string;
    readonly POSTGRES_DB: string;
    readonly DB_PORT: string;
}
