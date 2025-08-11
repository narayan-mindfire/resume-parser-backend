import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { once } from "events";
import minioClient from "../config/minioClient";
import redisClient from "../config/redisClient";
import { extractZipEntries } from "../utils/zipUtils";
import { validExtensions, bucketName } from "../constants/fileConstants";
import { fileProcessingQueue } from "../queues/fileProcessingQueue";

export const processChunkUpload = async (req: Request, res: Response) => {
  const { uploadId, chunkIndex, totalChunks, fileName } = req.body;

  if (!req.file || !uploadId || !chunkIndex || !totalChunks || !fileName) {
    res.status(400);
    throw new Error("Missing required fields");
  }

  const chunkDir = path.join(__dirname, `../../temp_chunks/${uploadId}`);
  if (!fs.existsSync(chunkDir)) fs.mkdirSync(chunkDir, { recursive: true });

  const chunkPath = path.join(chunkDir, `${chunkIndex}`);
  fs.renameSync(req.file.path, chunkPath);

  if (+chunkIndex !== +totalChunks - 1) {
    return res
      .status(200)
      .json({ message: "Chunk received, awaiting more chunks" });
  }

  const outputPath = path.join(__dirname, `../../uploads/${fileName}`);
  const writeStream = fs.createWriteStream(outputPath);

  for (let i = 0; i < +totalChunks; i++) {
    const partPath = path.join(chunkDir, `${i}`);
    const data = fs.readFileSync(partPath);
    writeStream.write(data);
    fs.unlinkSync(partPath);
  }

  writeStream.end();
  await once(writeStream, "finish");

  fs.rmSync(chunkDir, { recursive: true, force: true });

  const extractTo = path.join(__dirname, "../../extracted");
  if (!fs.existsSync(extractTo)) {
    fs.mkdirSync(extractTo, { recursive: true });
  }

  const extractedFiles = extractZipEntries(
    outputPath,
    extractTo,
    validExtensions,
  );
  fs.unlinkSync(outputPath);

  const urls: string[] = [];
  const bucketExists = await minioClient.bucketExists(bucketName);
  if (!bucketExists) await minioClient.makeBucket(bucketName);

  for (const file of extractedFiles) {
    const filePath = path.join(extractTo, file);
    const objectName = `${uploadId}/${file}`;

    await minioClient.fPutObject(bucketName, objectName, filePath);

    const presignedUrl = await minioClient.presignedUrl(
      "GET",
      bucketName,
      objectName,
      24 * 60 * 60 * 5,
    );

    urls.push(presignedUrl);

    await redisClient.set(
      `file:${presignedUrl}`,
      JSON.stringify({ status: "uploaded", timestamp: Date.now() }),
    );

    await fileProcessingQueue.add("processFile", {
      fileName: file,
      minioPath: objectName,
    });

    fs.unlinkSync(filePath);
  }

  return res.status(200).json({
    message: "Upload, extraction, and upload to MinIO complete",
    files: urls,
  });
};
