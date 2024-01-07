declare module NodeJS {
    /**
     * The `ProcessEnv` interface represents the environment variables available to the Node.js process.
     * Each key-value pair is represented by a property with the name of the environment variable.
     */
    interface ProcessEnv {
        /**
         * Comma-separated list of AWS regions where the CDK stack will be deployed.
         */
        [key: string]: string | undefined;
        CDK_DEPLOY_REGIONS: string;
        /**
         * Comma-separated list of environments (e.g., "development,production").
         */
        ENVIRONMENTS: string;
        /**
         * Name of the ECR repository.
         */
        ECR_REPOSITORY_NAME: string;
        /**
         * Name of the application.
         */
        APP_NAME: string;
        /**
         * Comma-separated list of platforms (e.g., "linux/amd64,linux/arm64").
         */
        PLATFORMS?: string;
        /**
         * Port number on which the application will run.
         */
        PORT: string;
        /**
         * Port number on which the database server is listening.
         */
        DB_PORT: string;
        /**
         * Username for the database connection.
         */
        POSTGRES_USER: string;
        /**
         * Password for the database connection.
         */
        POSTGRES_PASSWORD: string;
        /**
         * Name of the database to connect to.
         */
        POSTGRES_DB: string;
        /**
         * The environment the application is running in.
         */
        NODE_ENV: string;
        /**
         * The connection string for the application's database.
         */
        DATABASE_URL: string;
        /**
         * The secret used by NextAuth for authentication.
         */
        NEXTAUTH_SECRET: string;
        /**
         * A salt string for hashing or encryption.
         */
        SALT: string;
        /**
         * The base URL for the NextAuth application.
         */
        NEXTAUTH_URL: string;
        /**
         * Flag to enable or disable telemetry.
         */
        TELEMETRY_ENABLED: string;
        /**
         * Flag to enable or disable sign-up.
         */
        NEXT_PUBLIC_SIGN_UP_DISABLED: string;
        /**
         * Flag to enable or disable experimental features.
         */
        LANGFUSE_ENABLE_EXPERIMENTAL_FEATURES: string;
    }
}
