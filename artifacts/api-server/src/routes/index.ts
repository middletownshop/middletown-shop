import { Router, type IRouter } from "express";
import healthRouter from "./health";
import paymentsRouter from "./payments";
import paystackRouter from "./paystack";

const router: IRouter = Router();

router.use(healthRouter);
router.use(paymentsRouter);
router.use(paystackRouter);

export default router;