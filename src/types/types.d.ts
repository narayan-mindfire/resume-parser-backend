import { User } from "../generated/prisma";
import { UUID } from "crypto";
import { Request } from "express";

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

export interface AuthRequest extends Request {
  user: Omit<User, "password">;
}
