export interface TextParsingJob {
  fileName: string;
  uploadId: string;
  trackingKey: string;
}

export interface ParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  skills: string[];
  education: string[];
  experience: string[];
  totalExperienceYears: number | null;
}
