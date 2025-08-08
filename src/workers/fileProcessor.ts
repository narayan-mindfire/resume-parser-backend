import { Job, Worker } from "bullmq";
import redisClient from "../config/redisClient";
import minioClient from "../config/minioClient";
import fs from "fs";
import path from "path";
import { exec } from "child_process";

interface FileProcessingJob {
  fileName: string;
  minioPath: string;
}

export const processor = async (job: Job<FileProcessingJob>) => {
  const { fileName, minioPath } = job.data;
  console.log(`Start processing: ${fileName}`);

  const tempDir = path.join(__dirname, "../../temp_ocr");
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

  const localFilePath = path.join(tempDir, fileName);
  const baseName = path.parse(fileName).name;

  try {
    const stream = await minioClient.getObject("resumes", minioPath);
    await new Promise<void>((resolve, reject) => {
      const ws = fs.createWriteStream(localFilePath);
      stream.pipe(ws);
      ws.on("finish", resolve);
      ws.on("error", reject);
    });
  } catch (err) {
    console.error("Error fetching PDF:", err);
    return;
  }
  console.log(`Downloaded to ${localFilePath}`);

  await new Promise<void>((resolve, reject) => {
    exec(
      `docker run --rm -v ${tempDir}:/data minidocks/poppler pdftoppm /data/${fileName} /data/${baseName} -png`,
      (err, _stdout, stderr) => {
        if (err) {
          console.error("PDF → image conversion error:", stderr);
          return reject(err);
        }
        resolve();
      }
    );
  });

  const pngFiles = fs
    .readdirSync(tempDir)
    .filter((f) => f.startsWith(baseName) && f.endsWith(".png"));

  let fullText = "";
  for (const img of pngFiles) {
    const txt = await new Promise<string>((resolve, reject) => {
      exec(
        `docker run --rm -v ${tempDir}:/data jitesoft/tesseract-ocr /data/${img} stdout`,
        (err, stdout, stderr) => {
          if (err) {
            console.error("Tesseract error:", stderr);
            return reject(err);
          }
          resolve(stdout);
        }
      );
    });
    fullText += txt + "\n";
  }

  console.log(`OCR result:\n${fullText}`);

  await redisClient.set(
    `ocr:${fileName}`,
    JSON.stringify({ text: fullText, processedAt: Date.now() })
  );

  fs.readdirSync(tempDir)
    .filter((f) => f.startsWith(baseName))
    .forEach((f) => fs.unlinkSync(path.join(tempDir, f)));

  console.log(`Finished processing: ${fileName}`);
};

new Worker<FileProcessingJob>("file-processing", processor, {
  connection: redisClient,
});
