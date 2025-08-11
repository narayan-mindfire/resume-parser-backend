import { Job, Worker } from "bullmq";
import redisClient from "../config/redisClient";
import minioClient from "../config/minioClient";
import fs from "fs";
import path from "path";
import { exec } from "child_process";
import pdf from "pdf-parse";
import { textParsingQueue } from "../queues/textParsingQueue";

interface FileProcessingJob {
  fileName: string;
  minioPath: string;
}

async function runOCR(imagePath: string, tempDir: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    exec(
      `docker run --rm -v ${tempDir}:/data jitesoft/tesseract-ocr /data/${path.basename(imagePath)} stdout --psm 6 --oem 1`,
      (err, stdout, stderr) => {
        if (err) {
          console.error("Tesseract error:", stderr);
          return reject(err);
        }
        resolve(stdout);
      },
    );
  });
}

export const processor = async (job: Job<FileProcessingJob>) => {
  const { fileName, minioPath } = job.data;
  console.log(`Start processing: ${fileName}`);

  const tempDir = path.join(__dirname, "../../temp_ocr");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const localFilePath = path.join(tempDir, fileName);
  const baseName = path.parse(fileName).name;

  // Download file from MinIO
  try {
    const stream = await minioClient.getObject("resumes", minioPath);
    await new Promise<void>((resolve, reject) => {
      const ws = fs.createWriteStream(localFilePath);
      stream.pipe(ws);
      ws.on("finish", resolve);
      ws.on("error", reject);
    });
  } catch (err) {
    console.error("Error fetching file from MinIO:", err);
    return;
  }
  console.log(`Downloaded to ${localFilePath}`);

  let fullText = "";

  // Handle PDF files first
  if (fileName.toLowerCase().endsWith(".pdf")) {
    try {
      const pdfBuffer = fs.readFileSync(localFilePath);
      const pdfData = await pdf(pdfBuffer);
      if (pdfData.text && pdfData.text.trim().length > 50) {
        console.log("Extracted text directly from PDF (no OCR needed).");
        fullText = pdfData.text;
      } else {
        console.log("PDF text too short, falling back to OCR...");
        await new Promise<void>((resolve, reject) => {
          exec(
            `docker run --rm -v ${tempDir}:/data minidocks/poppler pdftoppm /data/${fileName} /data/${baseName} -png`,
            (err, _stdout, stderr) => {
              if (err) {
                console.error("PDF → image conversion error:", stderr);
                return reject(err);
              }
              resolve();
            },
          );
        });

        const pngFiles = fs
          .readdirSync(tempDir)
          .filter((f) => f.startsWith(baseName) && f.endsWith(".png"));

        for (const img of pngFiles) {
          const text = await runOCR(path.join(tempDir, img), tempDir);
          fullText += text + "\n";
        }
      }
    } catch (err) {
      console.error("Error processing PDF:", err);
      return;
    }
  } else {
    // For image files directly
    try {
      fullText = await runOCR(localFilePath, tempDir);
    } catch (err) {
      console.error("Error running OCR on image:", err);
      return;
    }
  }

  console.log(`Extracted text:\n${fullText}`);

  await redisClient.set(
    `ocr:${fileName}`,
    JSON.stringify({ text: fullText, processedAt: Date.now() }),
  );

  // Cleanup
  fs.readdirSync(tempDir)
    .filter((f) => f.startsWith(baseName))
    .forEach((f) => fs.unlinkSync(path.join(tempDir, f)));

  console.log(`Finished processing: ${fileName}`);
  await textParsingQueue.add("parse-text", { fileName });
};

new Worker<FileProcessingJob>("file-processing", processor, {
  connection: redisClient,
});
