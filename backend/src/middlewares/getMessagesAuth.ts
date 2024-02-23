import prisma from "@/utils/db/client";
import { createError } from "@utils/createError";
import { RequestHandler } from "express";
import * as v from "valibot";

export const GetMessagesAuth: RequestHandler = async (req, _res, next) => {
    try {
        if (!req.query.id) {
            return next(createError("Please provide the room id", 402));
        }
        if (!req.locals.user) {
            return next(createError("User not authenticated", 402));
        }
        const result = await v.safeParseAsync(
            v.string([v.uuid()]),
            req.query.id,
        );
        if (!result.success) {
            let msg = "";
            for (const issue of result.issues) {
                msg += issue.message + `(for value -> ${issue.input})\n`;
            }
            return next(createError(msg, 400));
        }
        const room = await prisma.room.findUnique({
            where: {
                id: result.output,
            },
        });
        if (!room) {
            return next(createError("Room not found", 404));
        }
        if (
            room.visibility === "public" ||
            room.ownerId === req.locals.user.id
        ) {
            return next();
        }

        const isAllowed = room.allowList.some(
            // @ts-expect-error ext bug
            (id) => id === req.locals.user.id,
        );

        if (!isAllowed) {
            return next(createError("User not allowed", 403));
        }
        return next();
    } catch (err) {
        return next(err);
    }
};
