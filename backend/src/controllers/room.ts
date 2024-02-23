import { User } from "@prisma/client";
import { createError } from "@utils/createError";
import prisma from "@utils/db/client";
import { Data } from "@utils/types";
import { RequestHandler } from "express";
import * as v from "valibot";

const roomExists = async (id: string) => {
    const room = await prisma.room.findUnique({
        where: {
            id: id,
        },
    });
    return room;
};

const getAndDeleteSchema = v.object({
    id: v.optional(v.string([v.minLength(3), v.uuid()])),
});

const createSchema = v.object({
    name: v.string([v.minLength(3), v.maxLength(20)]),
    visibility: v.union([v.literal("public"), v.literal("private")]),
    allowList: v.optional(
        v.array(v.string([v.minLength(3), v.maxLength(20)])),
        [],
    ),
});

const updateSchema = v.object({
    name: v.optional(v.string([v.minLength(3), v.maxLength(20)])),
    visibility: v.optional(
        v.union([v.literal("public"), v.literal("private")]),
    ),
    allowList: v.optional(v.array(v.string([v.minLength(3)])), []),
});

export const Get: RequestHandler = async (req, res, next) => {
    try {
        const result = await v.safeParseAsync(getAndDeleteSchema, req.query);
        if (result.success) {
            if (result.output.id) {
                const room = await roomExists(result.output.id as string);
                if (room) {
                    return res.status(200).json({
                        status: 200,
                        success: true,
                        room: room,
                    });
                } else {
                    return next(createError("Room not found", 404));
                }
            } else {
                const rooms = await prisma.room.findMany();
                return res.status(200).json({
                    status: 200,
                    success: true,
                    rooms: rooms,
                });
            }
        } else {
            let msg = "";
            for (const issue of result.issues) {
                msg += issue.message + `(for value -> ${issue.input})\n`;
            }
            return next(createError(msg, 400));
        }
    } catch (error) {
        return next(error);
    }
};

export const Create: RequestHandler = async (req, res, next) => {
    if (!req.body.name || !req.body.visibility) {
        return next(createError("Please provide all the fields", 402));
    }
    try {
        const result = await v.safeParseAsync(createSchema, req.body);
        if (result.success) {
            const room = await prisma.room.create({
                data: {
                    name: result.output.name,
                    visibility: result.output.visibility,
                    allowList: result.output.allowList,
                    ownerId: req.locals.user?.id as string,
                },
            });
            if (room) {
                return res.status(201).json({
                    status: 201,
                    success: true,
                    room: room,
                });
            } else {
                return next(createError("Failed to create room", 500));
            }
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

export const Update: RequestHandler = async (req, res, next) => {
    if (!req.body.id) {
        return next(createError("Please provide the id", 402));
    }
    try {
        const exists = await roomExists(req.body.id as string);
        if (exists) {
            const user = req.locals.user as User;
            if (user.id === exists.ownerId) {
                const result = await v.safeParseAsync(updateSchema, req.body);
                if (result.success) {
                    const updateData = new Data();
                    updateData.add(result.output, "name", result.output.name);
                    updateData.add(
                        result.output,
                        "visibility",
                        result.output.visibility,
                    );
                    updateData.add(
                        result.output,
                        "allowList",
                        result.output.allowList,
                    );

                    const newRoom = await prisma.room.update({
                        where: {
                            id: req.body.id as string,
                        },
                        data: updateData.data,
                    });
                    if (!newRoom)
                        return next(createError("Couldn't find the room", 402));
                    return res.status(201).json({
                        status: 201,
                        success: true,
                        user: newRoom,
                    });
                } else {
                    let msg = "";
                    for (const issue of result.issues) {
                        msg +=
                            issue.message + `(for value -> ${issue.input})\n`;
                    }
                    return next(createError(msg, 400));
                }
            } else {
                return next(
                    createError(
                        "You are not authorized to update this room",
                        403,
                    ),
                );
            }
        } else {
            return next(createError("Room not found", 404));
        }
    } catch (error) {
        return next(error);
    }
};

export const Delete: RequestHandler = async (req, res, next) => {
    if (!req.params.id) {
        return next(createError("Please provide the id", 402));
    }
    try {
        const result = await v.safeParseAsync(getAndDeleteSchema, req.params);
        if (result.success) {
            const exists = await roomExists(result.output.id as string);
            if (exists) {
                const room = await prisma.room.delete({
                    where: {
                        id: result.output.id,
                    },
                });
                if (room) {
                    return res.status(200).json({
                        status: 200,
                        success: true,
                        message: "Room deleted successfully",
                    });
                } else {
                    return next(createError("Room not found", 404));
                }
            } else {
                return next(createError("Room not found", 404));
            }
        } else {
            let msg = "";
            for (const issue of result.issues) {
                msg += issue.message + `(for value -> ${issue.input})\n`;
            }
            return next(createError(msg, 400));
        }
    } catch (error) {
        return next(error);
    }
};

export const GetMessages: RequestHandler = async (req, res, next) => {
    try {
        const exists = await roomExists(req.query.id as string);
        if (exists) {
            const messages = await prisma.message.findMany({
                where: {
                    roomId: req.query.id as string,
                },
            });
            return res.status(200).json({
                status: 200,
                success: true,
                messages: messages,
            });
        } else {
            return next(createError("Room not found", 404));
        }
    } catch (error) {
        return next(error);
    }
};
