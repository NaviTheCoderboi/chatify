import { Check, Login, Logout, Register } from "@/controllers/auth";
import { verifyToken } from "@/middlewares/verifyToken";
import { Router } from "express";

const router = Router();

router.post("/register", Register);
router.post("/login", Login);
router.use("/logout", verifyToken);
router.post("/logout", Logout);
router.get("/check", Check);

export default router;
