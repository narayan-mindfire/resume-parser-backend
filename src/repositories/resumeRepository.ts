import { UUID } from "crypto";
import pool from "../config/db";

export interface ResumeInsert {
  user_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  status?: string;
}

export const ResumeRepository = {
  async create(resume: ResumeInsert) {
    const query = `
      INSERT INTO resumes (user_id, file_name, file_path, file_type, status, uploaded_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *;
    `;
    const values = [
      resume.user_id,
      resume.file_name,
      resume.file_path,
      resume.file_type,
      resume.status || "PENDING",
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async findById(resumeId: UUID) {
    const result = await pool.query(`SELECT * FROM resumes WHERE Id = $1`, [
      resumeId,
    ]);
    return result.rows[0];
  },

  async findAll() {
    const result = await pool.query(
      `SELECT * FROM resumes ORDER BY updated_at DESC`,
    );
    return result.rows;
  },
};
