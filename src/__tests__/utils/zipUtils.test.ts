import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";
import { extractZipEntries } from "../../utils/zipUtils";

jest.mock("adm-zip");

jest.mock("fs", () => ({
  ...jest.requireActual("fs"),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe("extractZipEntries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockZipInstance = {
      getEntries: jest.fn(() => [
        {
          entryName: "resume1.pdf",
          isDirectory: false,
          getData: () => Buffer.from("PDF content"),
        },
        {
          entryName: "image.jpg",
          isDirectory: false,
          getData: () => Buffer.from("JPG content"),
        },
        {
          entryName: "invalid.txt",
          isDirectory: false,
          getData: () => Buffer.from("Text content"),
        },
        {
          entryName: "some_folder/",
          isDirectory: true,
          getData: () => Buffer.from(""),
        },
      ]),
    };
    (AdmZip as unknown as jest.Mock).mockImplementation(() => mockZipInstance);
  });

  test("should correctly extract files with valid extensions from a zip", () => {
    const mockZipPath = "mock-zip.zip";
    const mockExtractTo = "mock-extracted-dir";
    const validExtensions = [".pdf", ".jpg"];

    const extractedFiles = extractZipEntries(
      mockZipPath,
      mockExtractTo,
      validExtensions,
    );

    expect(extractedFiles).toEqual(["resume1.pdf", "image.jpg"]);

    expect(fs.writeFileSync).toHaveBeenCalledTimes(2);
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockExtractTo, "resume1.pdf"),
      expect.any(Buffer),
    );
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(mockExtractTo, "image.jpg"),
      expect.any(Buffer),
    );
  });
});
