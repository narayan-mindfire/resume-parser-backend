import express from "express";
import { getMyBatches } from "../controllers/batch.controller";
import { protect } from "../middlewares/auth.middleware";

const batchRouter = express.Router();

batchRouter.get("/my-batches", protect, getMyBatches);

export default batchRouter;
