// src/__tests__/utils/parser.test.ts

import { ParsedResume } from "../../workers/worker.types";
import { parseResumeText } from "../../workers/extractor.service";

// --- Mock the external 'compromise' library ---
jest.mock("compromise", () => {
  const mockNlp = (text: string) => ({
    people: () => ({
      out: (type: string) => {
        return ["John Doe"];
      },
    }),
    out: () => text,
  });
  return mockNlp;
});

describe("Resume Parser Utilities", () => {
  // Clean up any potential handles after tests
  afterAll(async () => {
    // Add a small delay to allow any pending operations to complete
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  const mockResumeText = `
    John Doe
    8898989898
    john.doe@example.com
    San Francisco, CA

    ---
    EDUCATION
    ---
    Bachelor of Science in Computer Science, University of California, Berkeley (2018 - 2022)

    ---
    SKILLS
    ---
    Proficient in: Javascript, TypeScript, React, Node.js, Docker
    
    ---
    EXPERIENCE
    ---
    Software Engineer | Tech Company A | Jan 2022 - Present
    - Developed and maintained web applications.
    
    Junior Developer | Tech Company B | July 2020 - Dec 2021
    - Assisted in building new features.
  `;

  test("parseResumeText should correctly extract all resume fields", () => {
    const parsedData: ParsedResume = parseResumeText(mockResumeText);
    console.log("phone:", parsedData.phone);
    expect(parsedData.name).toBe("John Doe");
    expect(parsedData.email).toBe("john.doe@example.com");
    expect(parsedData.phone?.trim()).toBe("8898989898");
    expect(parsedData.skills).toEqual(
      expect.arrayContaining([
        "javascript",
        "typescript",
        "react",
        "node.js",
        "docker",
      ]),
    );
    expect(parsedData.education).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Bachelor of Science in Computer Science"),
      ]),
    );
    expect(parsedData.experience).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Software Engineer"),
        expect.stringContaining("Junior Developer"),
      ]),
    );

    expect(parsedData.totalExperienceYears).toBeCloseTo(3.58, 2);
  });
});
