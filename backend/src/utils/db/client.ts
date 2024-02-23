// import { Pool, neonConfig } from "@neondatabase/serverless";
// import { PrismaNeon } from "@prisma/adapter-neon";
// import env from "@utils/env";
// import ws from "ws";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// neonConfig.webSocketConstructor = ws;

// const connectionString = env.DATABASE_URL;
// const pool = new Pool({ connectionString });
// const adapter = new PrismaNeon(pool);

const prisma = new PrismaClient().$extends({
    query: {
        user: {
            async create({ args, query }) {
                args.data.password = await bcrypt.hash(args.data.password, 10);
                return query(args);
            },
            async update({ args, query }) {
                if (
                    args.data.password &&
                    typeof args.data.password !== "string" &&
                    args.data.password.set
                ) {
                    args.data.password.set = await bcrypt.hash(
                        args.data.password.set,
                        10,
                    );
                }
                return query(args);
            },
        },
    },
});

export default prisma;
