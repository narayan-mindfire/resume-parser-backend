import { parseResumeText } from "../../workers/extractor.service";
import { ParsedResume } from "../../workers/worker.types";

describe("parseResumeText", () => {
  it("should correctly extract all fields from a simple resume", () => {
    const resumeText = `
      John Doe
      john.doe@example.com
      +1 555-123-4567

      Skills: JavaScript, TypeScript, React

      Education
      Bachelor of Science in Computer Science - MIT

      Work Experience
      Software Engineer at ExampleCorp
      January 2020 - March 2022

      Senior Developer at AnotherCorp
      Apr 2022 - Present
    `;

    const result: ParsedResume = parseResumeText(resumeText);

    expect(result.name).toBe("John Doe");
    expect(result.email).toBe("john.doe@example.com");
    expect(result.phone?.trim()).toBe("+1 555-123-4567");

    // Skills
    expect(result.skills).toEqual(
      expect.arrayContaining(["javascript", "typescript", "react"]),
    );

    // Education
    expect(result.education).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Bachelor of Science in Computer Science"),
      ]),
    );

    // Experience
    expect(result.experience).toEqual(
      expect.arrayContaining([
        expect.stringContaining("Software Engineer at ExampleCorp"),
        expect.stringContaining("Senior Developer at AnotherCorp"),
      ]),
    );

    // Total years should be > 0
    expect(result.totalExperienceYears).toBeGreaterThan(0);
  });

  it("should handle resumes with missing sections gracefully", () => {
    const resumeText = `
      Jane Smith
      jane.smith@example.in
    `;

    const result = parseResumeText(resumeText);

    expect(result.name).toBe("Jane Smith");
    expect(result.skills).toEqual([]);
    expect(result.education).toEqual([]);
    expect(result.experience).toEqual([]);
    expect(result.totalExperienceYears).toBeNull();
  });
});
