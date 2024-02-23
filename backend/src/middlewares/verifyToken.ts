import { createError } from "@utils/createError";
import prisma from "@utils/db/client";
import env from "@utils/env";
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";

export const verifyToken: RequestHandler = async (req, _res, next) => {
    try {
        if (req.locals?.user) next();

        const token =
            req.cookies?.jwt || req.headers.authorization?.split(" ")[1];
        if (token) {
            const userId = jwt.verify(token, env.JWT_KEY) as { id: string };
            const user = await prisma.user.findUnique({
                where: {
                    id: userId.id,
                },
            });
            if (user) {
                req.locals = {
                    user: user,
                };
                next();
            } else {
                next(createError("Authentication failed", 401));
            }
        } else {
            return next(createError("User not authenticated", 402));
        }
    } catch (err) {
        return next(err);
    }
};
