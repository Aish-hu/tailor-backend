import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth";
import {
  checkout,
  getMyOrders,
  getOrder,
  listAllOrders,
  updateOrderStatus,
} from "../controllers/orderController";

const router = Router();

router.use(requireAuth);

router.post("/checkout", checkout);
router.get("/my", getMyOrders);
router.get("/:id", getOrder);

// Admin/seller views — this is where measurements automatically show up.
router.get("/", requireAdmin, listAllOrders);
router.patch("/:id/status", requireAdmin, updateOrderStatus);

export default router;
