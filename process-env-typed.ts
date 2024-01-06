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
    readonly IMAGE_VERSION: string;
    /**
     * Comma-separated list of platforms for which the Docker image is built.
     * Example: "linux/amd64,linux/arm64"
     */
    readonly PLATFORMS?: string;
    /**
     * Port number on which the application will run.
     */
    PORT: string;
}

export interface DockerEnvTyped {
    /**
     * The environment the application is running in.
     */
    readonly NODE_ENV: string;
    /**
     * The connection string for the application's database.
     */
    readonly DATABASE_URL: string;
    /**
     * The secret used by NextAuth for authentication.
     */
    readonly NEXTAUTH_SECRET: string;
    /**
     * A salt string for hashing or encryption.
     */
    readonly SALT: string;
    /**
     * The base URL for the NextAuth application.
     */
    readonly NEXTAUTH_URL: string;
    /**
     * Flag to enable or disable telemetry.
     */
    readonly TELEMETRY_ENABLED: string;
    /**
     * Flag to enable or disable sign-up.
     */
    readonly NEXT_PUBLIC_SIGN_UP_DISABLED: string;
    /**
     * Flag to enable or disable experimental features.
     */
    readonly LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES: string;
}

export interface DatabaseEnvTyped {
    /**
     * The username for the database connection.
     */
    readonly POSTGRES_USER: string;
    /**
     * The password for the database connection.
     */
    readonly POSTGRES_PASSWORD: string;
    /**
     * The name of the database to connect to.
     */
    readonly POSTGRES_DB: string;
    /**
     * The port number on which the database server is listening.
     */
    readonly DB_PORT: string;
}
