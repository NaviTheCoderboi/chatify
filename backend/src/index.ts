import WSSServer from "@/controllers/chat";
import authRouter from "@/routers/auth";
import roomRouter from "@/routers/room";
import userRouter from "@/routers/user";
import env from "@utils/env";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { createServer } from "http";
import pinoHttp from "pino-http";
import { WebSocketServer } from "ws";
import { ErrorType } from "./utils/types";

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

if (env.NODE_ENV === "development") {
    app.use(
        pinoHttp({
            transport: {
                target: "pino-pretty",
                options: {
                    translateTime: "HH:MM:ss Z",
                    ignore: "pid,hostname",
                    colorize: true,
                },
            },
        }),
    );
} else if (env.NODE_ENV === "production") {
    app.use(pinoHttp());
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
    cors({
        credentials: true,
        methods: ["GET", "PATCH", "POST", "DELETE"],
        origin: "*", // change it lator to the frontend url
    }),
);
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/room", roomRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: ErrorType, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || 500;
    const message = err.message;
    return res.status(status).json({
        success: false,
        status,
        message,
    });
});

app.get("/", (_, res) => {
    res.send({
        ping: "pong",
    });
});

server.listen(env.PORT, env.HOST, () => {
    console.log(`Server is running on http://${env.HOST}:${env.PORT}`);
});

wss.on("connection", async (ws, req) => {
    await WSSServer(ws, req, wss);
});
