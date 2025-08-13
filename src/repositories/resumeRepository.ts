import { PrismaClient, Prisma, Resume } from "../../generated/prisma";
const prisma = new PrismaClient();

/**
 * @class ResumeRepository
 * @description Handles all database interactions for the Resume model.
 */
class ResumeRepository {
  /**
   * Creates a new resume entry in the database.
   * @param data The resume data to create.
   * @returns The newly created resume object.
   */
  async create(data: Prisma.ResumeCreateInput): Promise<Resume> {
    return prisma.resume.create({ data });
  }

  /**
   * Finds a resume by its unique ID.
   * @param id The resume's UUID.
   * @returns The resume object or null if not found.
   */
  async findById(id: string): Promise<Resume | null> {
    return prisma.resume.findUnique({ where: { id } });
  }

  /**
   * Finds a resume by its unique ID.
   * @param id The resume's UUID.
   * @returns The resume object or null if not found.
   */
  async findAll(): Promise<Resume[] | null> {
    return prisma.resume.findMany();
  }

  /**
   * Finds a resume by its unique file name.
   * @param fileName The resume's file name.
   * @returns The resume object or null if not found.
   */
  async findByFileName(fileName: string): Promise<Resume | null> {
    return prisma.resume.findUnique({ where: { fileName } });
  }

  /**
   * Updates an existing resume entry.
   * @param id The resume's UUID.
   * @param data The data to update.
   * @returns The updated resume object.
   */
  async update(id: string, data: Prisma.ResumeUpdateInput): Promise<Resume> {
    return prisma.resume.update({ where: { id }, data });
  }

  /**
   * Updates the processing status and error message of a resume.
   * @param id The resume's UUID.
   * @param status The new processing status.
   * @param errorMessage The error message (optional).
   * @returns The updated resume object.
   */
  async updateStatusAndError(
    id: string,
    status: string,
    errorMessage?: string,
  ): Promise<Resume> {
    return prisma.resume.update({
      where: { id },
      data: {
        processingStatus: status,
        errorMessage: errorMessage,
      },
    });
  }
}

export const resumeRepository = new ResumeRepository();
