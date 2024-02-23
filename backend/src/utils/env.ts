import dotenv from "dotenv";

dotenv.config();

const getOptionalKey = <T>(
    key: string,
    defaultV: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser: ((value: any) => T) | null = null,
) => {
    const value = process.env[key];
    if (!value) {
        return defaultV;
    }
    if (!parser) {
        return value as T;
    }
    return parser(value) as T;
};

const getRequiredKey = <T>(
    key: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parser: ((value: any) => T) | null = null,
) => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Key ${key} not found`);
    }
    if (!parser) {
        return value as T;
    }
    return parser(value) as T;
};

enum NodeEnv {
    Development = "development",
    Production = "production",
    Test = "test",
}

interface Env {
    NODE_ENV: NodeEnv;
    HOST: string;
    PORT: number;
    DATABASE_URL: string;
    JWT_KEY: string;
    GITHUB_CLIENT_ID: string;
    GITHUB_SECRET: string;
}

let env: Env;

try {
    env = {
        NODE_ENV: getOptionalKey<string>(
            "NODE_ENV",
            NodeEnv.Development,
        ) as NodeEnv,
        HOST: getOptionalKey<string>("HOST", "localhost"),
        PORT: getOptionalKey<number>("PORT", 3000, parseInt),
        DATABASE_URL: getRequiredKey<string>("DATABASE_URL"),
        JWT_KEY: getRequiredKey<string>("JWT_KEY"),
        GITHUB_CLIENT_ID: getRequiredKey<string>("GITHUB_CLIENT_ID"),
        GITHUB_SECRET: getRequiredKey<string>("GITHUB_SECRET"),
    };
} catch {
    process.exit(1);
}

export default env;
