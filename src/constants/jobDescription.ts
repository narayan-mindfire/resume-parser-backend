import { JobType } from "../types/types";

export const JOBS: JobType[] = [
  {
    id: "j1",
    title: "Full Stack Developer",
    description:
      "Build and maintain web applications using modern frameworks...",
    skills: [
      "javascript",
      "typescript",
      "react",
      "redux",
      "node.js",
      "postgresql",
    ],
    required_experience_years: 1,
  },
  {
    id: "j2",
    title: "Data Engineer",
    description:
      "Design and build scalable data pipelines and storage solutions...",
    skills: ["python", "sql", "postgresql", "aws", "airflow"],
    required_experience_years: 20,
  },
];
