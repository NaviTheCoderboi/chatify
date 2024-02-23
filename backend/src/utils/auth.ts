import prisma from "@utils/db/client";
import env from "@utils/env";
import jwt from "jsonwebtoken";

const generateJWTToken = async (user_id: string) => {
    try {
        const token = jwt.sign({ id: user_id }, env.JWT_KEY);
        await prisma.token.create({
            data: {
                token: token,
                userId: user_id,
            },
        });
        return token;
    } catch (error) {
        return `${error}`;
    }
};

const verifyToken = (token: string) => {
    try {
        const user = jwt.verify(token, env.JWT_KEY) as { id: string };
        return user;
    } catch {
        return;
    }
};

export { generateJWTToken, verifyToken };
