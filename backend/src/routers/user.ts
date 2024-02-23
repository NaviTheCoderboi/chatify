import { Edit } from "@/controllers/user";
import { verifyToken } from "@/middlewares/verifyToken";
import { Router } from "express";

const router = Router();

router.use("/edit", verifyToken);
router.patch("/edit", Edit);

export default router;
