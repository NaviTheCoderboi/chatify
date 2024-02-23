import { User } from "@prisma/client";
import { createError } from "@utils/createError";
import prisma from "@utils/db/client";
import { Data } from "@utils/types";
import { RequestHandler } from "express";
import * as v from "valibot";

const updateSchema = v.object({
    username: v.optional(v.string([v.minLength(3), v.maxLength(20)])),
    password: v.optional(v.string([v.minLength(8), v.maxLength(20)])),
});

export const Edit: RequestHandler = async (req, res, next) => {
    try {
        const result = await v.safeParseAsync(updateSchema, req.body);
        if (result.success) {
            const user = req.locals.user as User;

            const updateData = new Data();
            updateData.add(result.output, "username", result.output.username);
            updateData.add(result.output, "password", result.output.password);

            const newUser = await prisma.user.update({
                where: {
                    id: user.id,
                },
                data: updateData.data,
            });
            if (!newUser)
                return next(createError("Couldn't find the user", 402));
            return res.status(201).json({
                status: 201,
                success: true,
                user: newUser,
            });
        } else {
            let msg = "";
            for (const issue of result.issues) {
                msg += issue.message + `(for value -> ${issue.input})\n`;
            }
            return next(createError(msg, 400));
        }
    } catch (err) {
        return next(err);
    }
};
