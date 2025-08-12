import { UUID } from "crypto";

export interface Resume {
  Id: UUID;
  file_name: string;
  name: string;
  phone: string;
  email: string;
  education: string[];
  experience: string[];
  skills: string[];
  total_experience_years: string;
  raw_text: string;
}

export interface JobType {
  id: string;
  title: string;
  description: string;
  skills: string[];
  required_experience_years: number;
}
