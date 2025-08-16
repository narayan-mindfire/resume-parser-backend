import express from "express";
import { getMyBatches, getMyInsights } from "../controllers/batch.controller";
import { protect } from "../middlewares/auth.middleware";

const batchRouter = express.Router();

batchRouter.get("/my-batches", protect, getMyBatches);
batchRouter.get("/insights", protect, getMyInsights);

export default batchRouter;
