import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

export const extractZipEntries = (
  zipFilePath: string,
  extractTo: string,
  validExtensions: string[],
): string[] => {
  const zip = new AdmZip(zipFilePath);
  const extractedFiles: string[] = [];

  zip.getEntries().forEach((entry) => {
    const ext = path.extname(entry.entryName).toLowerCase();
    if (!entry.isDirectory && validExtensions.includes(ext)) {
      const extractedPath = path.join(
        extractTo,
        path.basename(entry.entryName),
      );
      fs.writeFileSync(extractedPath, entry.getData());
      extractedFiles.push(path.basename(entry.entryName));
    }
  });

  return extractedFiles;
};
