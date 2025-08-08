import express from "express";
import multer from "multer";
import { handleZipUpload } from "../controllers/upload.controller";

const uploadRouter = express.Router();
const upload = multer({ dest: "temp_chunks/" });

uploadRouter.post("/zip", upload.single("chunk"), handleZipUpload);

export default uploadRouter;
