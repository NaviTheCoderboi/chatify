import { User } from "@prisma/client";
import { generateJWTToken } from "@utils/auth";
import { createError } from "@utils/createError";
import prisma from "@utils/db/client";
import env from "@utils/env";
import { CookieType } from "@utils/types";
import bcrypt from "bcryptjs";
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import * as v from "valibot";

const cookieOps: CookieType = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    httpOnly: true,
};
if (env.NODE_ENV === "production") cookieOps.secure = true;

const registerSchema = v.object({
    username: v.string([v.minLength(3), v.maxLength(20)]),
    password: v.string([v.minLength(8), v.maxLength(20)]),
    email: v.string([v.toTrimmed(), v.email()]),
});

const loginSchema = v.object({
    email: v.string([v.toTrimmed(), v.email()]),
    password: v.string([v.minLength(8), v.maxLength(20)]),
});

export const Register: RequestHandler = async (req, res, next) => {
    if (!req.body.username || !req.body.password || !req.body.email) {
        return next(createError("Please provide all the fields", 402));
    }
    try {
        const result = await v.safeParseAsync(registerSchema, req.body);
        if (result.success) {
            const user_exists = await prisma.user.findFirst({
                where: {
                    OR: [
                        { username: result.output.username },
                        { email: result.output.email },
                    ],
                },
            });
            if (user_exists) {
                return next(
                    createError(
                        "Username or email already exists, please login to proceed",
                        402,
                    ),
                );
            }
            const user = await prisma.user.create({
                data: {
                    username: result.output.username,
                    email: result.output.email,
                    password: result.output.password,
                },
            });
            const token = await generateJWTToken(user.id);
            if (user) {
                res.cookie("jwt", token, cookieOps).status(201).json({
                    success: true,
                    status: 201,
                    message: "User registered successfully",
                });
            } else {
                return next(createError("Failed to register user", 500));
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

export const Login: RequestHandler = async (req, res, next) => {
    if (!req.body.email || !req.body.password) {
        return next(createError("Please provide all the fields", 402));
    }
    try {
        const result = await v.safeParseAsync(loginSchema, req.body);
        if (result.success) {
            const user = await prisma.user.findFirst({
                where: {
                    email: result.output.email,
                },
            });
            if (!user) {
                return next(createError("Invalid credentials", 402));
            }

            const passwordMatch = await bcrypt.compare(
                result.output.password,
                user.password,
            );
            if (!passwordMatch) {
                return next(createError("Invalid credentials", 402));
            }
            const token = await generateJWTToken(user.id);
            return res.cookie("jwt", token, cookieOps).status(200).json({
                success: true,
                status: 200,
                message: "User logged in successfully",
            });
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

export const Logout: RequestHandler = async (req, res, next) => {
    const { id } = req.locals.user as User;
    const token = req.cookies.jwt;
    try {
        const result = await prisma.token.deleteMany({
            where: {
                AND: {
                    token: token,
                    userId: id,
                },
            },
        });
        if (result) {
            res.clearCookie("jwt");
            return res.status(200).json({
                success: true,
                message: "logged out successfully",
                status: 200,
            });
        }
    } catch (err) {
        return next(err);
    }
};

export const Check: RequestHandler = async (req, res, next) => {
    try {
        const token =
            req.headers.authorization?.split(" ")[1] || req.cookies.jwt;
        if (token && token !== "null") {
            const userId = jwt.verify(token, env.JWT_KEY) as { id: string };
            const user = await prisma.user.findUnique({
                where: {
                    id: userId.id,
                },
            });
            return res.status(200).json({
                success: true,
                loggedIn: true,
                user,
            });
        }
        return res.status(200).json({
            success: true,
            loggedIn: false,
            user: null,
        });
    } catch (err) {
        return next(err);
    }
};
