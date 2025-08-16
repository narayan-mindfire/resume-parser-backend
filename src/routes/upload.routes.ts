import express from "express";
import multer from "multer";
import { handleZipUpload } from "../controllers/upload.controller";
import { protect } from "../middlewares/auth.middleware";

const uploadRouter = express.Router();
const upload = multer({ dest: "temp_chunks/" });

uploadRouter.post("/zip", protect, upload.single("chunk"), handleZipUpload);

export default uploadRouter;
