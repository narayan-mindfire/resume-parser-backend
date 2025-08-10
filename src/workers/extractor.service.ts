import { ParsedResume } from "./worker.types";
import nlp from "compromise";
import {
  educationKeywords,
  EMAIL_REGEX,
  PHONE_REGEX,
  skillKeywords,
} from "./constants";
/**
 * Extracts a candidate's name from the resume text using pattern matching
 * and NLP as a fallback.
 * @param {string} text The raw text of the resume.
 * @returns {string | null} The extracted name or null if not found.
 */
function extractName(text: string): string | null {
  // Basic extraction from the first few lines
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const potentialNames = lines
    .slice(0, 5)
    .map((line) => {
      // Try to find a line that looks like a name (e.g., "John Doe")
      if (/^[A-Z][a-z]+(?:\s+[A-Z][a-z]*){1,3}$/.test(line)) {
        return line;
      }
      return null;
    })
    .filter(Boolean);

  // Fallback to NLP if no clear name is found
  if (potentialNames.length > 0) return potentialNames[0];

  // Using compromise for more advanced name extraction
  // This is useful if the resume doesn't have a clear name on the first few lines
  const doc = nlp(text);
  const people = doc.people().out("array");
  return people.length > 0 ? people[0] : null;
}

/**
 * Extracts an email address from the resume text using a regular expression.
 * @param {string} text The raw text of the resume.
 * @returns {string | null} The extracted email or null if not found.
 */
function extractEmail(text: string): string | null {
  const emailMatches = text.match(EMAIL_REGEX);
  return emailMatches ? emailMatches[0] : null;
}

/**
 * Extracts a phone number from the resume text using a regular expression.
 * @param {string} text The raw text of the resume.
 * @returns {string | null} The extracted phone number or null if not found.
 */
function extractPhone(text: string): string | null {
  const phoneMatches = text.match(PHONE_REGEX);
  return phoneMatches ? phoneMatches[0] : null;
}

/**
 * Extracts a list of skills from the resume text using a predefined keyword list
 * and section-based extraction.
 * @param {string} text The raw text of the resume.
 * @returns {string[]} An array of skills.
 */
function extractSkills(text: string): string[] {
  const foundSkills = new Set<string>();

  // Search for skills in specific sections
  const skillsSection = text
    .toLowerCase()
    .split(/(?:skills|technologies|proficiencies):/)[1];
  if (skillsSection) {
    const skillsBlock = skillsSection.split(
      /(?:experience|education|projects):/
    )[0];
    if (skillsBlock) {
      skillsBlock.split(/[\n,•·\-—;]+/).forEach((skill) => {
        const cleaned = skill.trim().toLowerCase();
        if (skillKeywords.includes(cleaned)) {
          foundSkills.add(cleaned);
        }
      });
    }
  }

  // Search for skills anywhere in the document
  skillKeywords.forEach((keyword) => {
    if (text.toLowerCase().includes(keyword)) {
      foundSkills.add(keyword);
    }
  });

  return Array.from(foundSkills);
}

/**
 * Extracts a list of educational qualifications from the resume text.
 * @param {string} text The raw text of the resume.
 * @returns {string[]} An array of education strings.
 */
function extractEducation(text: string): string[] {
  const foundEducation = new Set<string>();

  const lines = text.split("\n");
  lines.forEach((line) => {
    const lowerLine = line.toLowerCase();
    if (
      educationKeywords.some((keyword) => lowerLine.includes(keyword)) &&
      line.trim().length > 10
    ) {
      foundEducation.add(line.trim());
    }
  });
  return Array.from(foundEducation);
}

/**
 * IMPROVED EXPERIENCE EXTRACTION FUNCTION
 * Extracts work experience entries from resume text with better accuracy
 * Handles various resume formats and properly identifies job titles vs descriptions
 */
function extractExperience(text: string): string[] {
  const foundExperience = new Set<string>();
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Find the experience section boundaries
  let experienceStartIndex = -1;
  let experienceEndIndex = lines.length;

  const experienceHeaders =
    /^(experience|work experience|professional experience|employment history|work history)$/i;
  const sectionHeaders =
    /^(education|skills|technical skills|projects|achievements|certifications|awards|profiles)$/i;

  // Find experience section start
  for (let i = 0; i < lines.length; i++) {
    if (experienceHeaders.test(lines[i])) {
      experienceStartIndex = i;
      break;
    }
  }

  // If experience section found, find its end
  if (experienceStartIndex !== -1) {
    for (let i = experienceStartIndex + 1; i < lines.length; i++) {
      if (sectionHeaders.test(lines[i])) {
        experienceEndIndex = i;
        break;
      }
    }

    // Extract experience entries from the section
    const experienceLines = lines.slice(
      experienceStartIndex + 1,
      experienceEndIndex
    );

    for (const line of experienceLines) {
      // Skip bullet points, descriptions, and empty lines
      if (
        line.startsWith("•") ||
        line.startsWith("-") ||
        line.startsWith("*")
      ) {
        continue;
      }

      // Skip lines that are only dates
      if (
        /^(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}\s*-/i.test(
          line
        )
      ) {
        continue;
      }

      // Look for job titles and company names (meaningful experience entries)
      if (line.length > 10) {
        // Check if line contains company/position indicators
        const hasCompanyIndicators =
          /\b(intern|developer|engineer|manager|lead|analyst|consultant|specialist|coordinator|assistant|officer|executive|director|founder|ceo|cto|senior|junior|llp|ltd|inc|corp|company|technologies|solutions|systems|digital|software|volunteer)\b/i.test(
            line
          );
        const hasDatePattern =
          /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4}|\d{4}\s*-\s*(\d{4}|present)/i.test(
            line
          );

        // Include lines that have either company indicators or date patterns
        if (hasCompanyIndicators || hasDatePattern) {
          foundExperience.add(line);
        }
      }
    }
  }

  return Array.from(foundExperience);
}

/**
 * IMPROVED TOTAL EXPERIENCE CALCULATION FUNCTION
 * Calculates total years of work experience with better date parsing
 * Supports multiple date formats and handles "Present" correctly
 */
function extractTotalExperience(text: string): number | null {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  // Find the experience section boundaries
  let experienceStartIndex = -1;
  let experienceEndIndex = lines.length;

  const experienceHeaders =
    /^(experience|work experience|professional experience|employment history|work history)$/i;
  const sectionHeaders =
    /^(education|skills|technical skills|projects|achievements|certifications|awards|profiles)$/i;

  // Find experience section boundaries
  for (let i = 0; i < lines.length; i++) {
    if (experienceHeaders.test(lines[i])) {
      experienceStartIndex = i;
      break;
    }
  }

  if (experienceStartIndex !== -1) {
    for (let i = experienceStartIndex + 1; i < lines.length; i++) {
      if (sectionHeaders.test(lines[i])) {
        experienceEndIndex = i;
        break;
      }
    }
  }

  // If no experience section found, return null
  if (experienceStartIndex === -1) {
    return null;
  }

  const experienceText = lines
    .slice(experienceStartIndex, experienceEndIndex)
    .join("\n");

  // Enhanced date range patterns to handle various formats
  const datePatterns = [
    // January 2025 - Present
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\s*-\s*present\b/gi,
    // Jan 2025 - Present
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})\s*-\s*present\b/gi,
    // January 2023 - September 2023
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\s*-\s*(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{4})\b/gi,
    // Jan 2023 - Sep 2023
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})\s*-\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{4})\b/gi,
    // 2023 - 2024
    /\b(\d{4})\s*-\s*(\d{4})\b/g,
    // 2023 - Present
    /\b(\d{4})\s*-\s*present\b/gi,
  ];

  // Month name to number mapping
  const monthMap: { [key: string]: number } = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    oct: 9,
    nov: 10,
    dec: 11,
  };

  let totalMonths = 0;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Process each date pattern
  for (const pattern of datePatterns) {
    let match;
    while ((match = pattern.exec(experienceText)) !== null) {
      if (pattern.source.includes("present")) {
        // Handle patterns ending with "Present"
        if (match.length >= 3) {
          // Month Year - Present pattern
          const startMonth = monthMap[match[1]?.toLowerCase()] ?? 0;
          const startYear = parseInt(match[2]);

          if (!isNaN(startYear)) {
            totalMonths +=
              (currentYear - startYear) * 12 + (currentMonth - startMonth);
          }
        } else if (match.length === 3) {
          // Year - Present pattern
          const startYear = parseInt(match[1]);
          if (!isNaN(startYear)) {
            totalMonths += (currentYear - startYear) * 12;
          }
        }
      } else if (match.length >= 5) {
        // Handle "Month Year - Month Year" patterns
        const startMonth = monthMap[match[1]?.toLowerCase()] ?? 0;
        const startYear = parseInt(match[2]);
        const endMonth = monthMap[match[3]?.toLowerCase()] ?? 0;
        const endYear = parseInt(match[4]);

        if (!isNaN(startYear) && !isNaN(endYear)) {
          totalMonths += (endYear - startYear) * 12 + (endMonth - startMonth);
        }
      } else if (match.length === 3) {
        // Handle "Year - Year" patterns
        const startYear = parseInt(match[1]);
        const endYear = parseInt(match[2]);

        if (!isNaN(startYear) && !isNaN(endYear)) {
          totalMonths += (endYear - startYear) * 12;
        }
      }
    }
  }

  // Convert months to years with 2 decimal precision
  return totalMonths > 0 ? parseFloat((totalMonths / 12).toFixed(2)) : null;
}

// --- The Core Parser Function ---
export const parseResumeText = (text: string): ParsedResume => {
  // Clean up text
  const cleanText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  // Extract information using the helper functions
  const name = extractName(cleanText);
  const email = extractEmail(cleanText);
  const phone = extractPhone(cleanText);
  const skills = extractSkills(cleanText);
  const education = extractEducation(cleanText);
  const experience = extractExperience(cleanText);
  const totalExperienceYears = extractTotalExperience(cleanText);

  return {
    name,
    email,
    phone,
    skills,
    education,
    experience,
    totalExperienceYears,
  };
};
