import { Create, Delete, Get, GetMessages, Update } from "@/controllers/room";
import { GetMessagesAuth } from "@/middlewares/getMessagesAuth";
import { verifyToken } from "@/middlewares/verifyToken";
import { Router } from "express";

const router = Router();

router.use("/create", verifyToken);
router.post("/create", Create);

router.get("/get", Get);

router.use("/delete/:id", verifyToken);
router.delete("/delete/:id", Delete);

router.use("/update", verifyToken);
router.patch("/update", Update);

router.use("/getMessages", verifyToken);
router.use("/getMessages", GetMessagesAuth);
router.get("/getMessages", GetMessages);

export default router;
