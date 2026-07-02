import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { verifyPayment } from "../controllers/paymentController";

const router = Router();

router.post("/verify", requireAuth, verifyPayment);

export default router;
