/* eslint-disable @typescript-eslint/no-unused-vars */
import { verifyToken } from "@utils/auth";
import prisma from "@utils/db/client";
import { IncomingMessage } from "node:http";
import url from "node:url";
import * as v from "valibot";
import { Server, WebSocket } from "ws";

const response = (message: string, success: boolean = true): string => {
    if (success === undefined || message === undefined)
        throw new Error("Invalid response");
    return JSON.stringify({
        success,
        message,
    });
};

const getCookies = (req: IncomingMessage) => {
    const cookies: { [key: string]: string } = {};
    if (req.headers.cookie) {
        req.headers.cookie.split(";").forEach((cookie) => {
            const parts = cookie.match(/(.*?)=(.*)$/);
            // @ts-expect-error extension issue
            const name = parts ? parts[1].trim() : "";
            const value = parts ? (parts[2] || "").trim() : "";
            cookies[name] = value;
        });
    }
    return cookies;
};

const WSSServer = async (
    ws: WebSocket,
    req: IncomingMessage,
    _wss: Server<typeof WebSocket, typeof IncomingMessage>,
) => {
    const cookies = getCookies(req);
    const token = cookies["jwt"] || "";
    if (!token || !req.url) {
        ws.send(response("Unauthorized", false));
        ws.close();
        return;
    }
    const user = verifyToken(token);
    if (!user) {
        ws.send(response("Unauthorized", false));
        ws.close();
        return;
    }

    const roomIdResult = await v.safeParseAsync(
        v.string([v.uuid()]),
        url.parse(req.url, true).query.roomId,
    );
    if (!roomIdResult.success) {
        ws.send(response("Invalid room id", false));
        ws.close();
        return;
    }

    const room = await prisma.room.findUnique({
        where: {
            id: roomIdResult.output,
        },
    });
    if (!room) {
        ws.send(response("Room not found", false));
        ws.close();
        return;
    }

    if (room.visibility === "private") {
        if (user.id !== room.ownerId && !room.allowList.includes(user.id)) {
            ws.send(response("Unauthorized", false));
            ws.close();
            return;
        }
    }

    ws.on("message", async (msg) => {
        console.log(msg.toString());
    });

    // ws.send(response(`Welcome to the chat room ${roomIdResult.output}`));
};

export default WSSServer;
