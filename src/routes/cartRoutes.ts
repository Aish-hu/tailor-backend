import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  getMyCart,
  addToCart,
  updateCartItem,
  removeCartItem,
} from "../controllers/cartController";

const router = Router();

router.use(requireAuth); // every cart route requires a logged-in customer

router.get("/", getMyCart);
router.post("/", addToCart);
router.put("/:id", updateCartItem);
router.delete("/:id", removeCartItem);

export default router;
