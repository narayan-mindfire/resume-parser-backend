import { PrismaClient, User } from "../../generated/prisma";
const prisma = new PrismaClient();

/**
 * @class AuthRepository
 * @description Handles all database interactions for the user model.
 */
class AuthRepository {
  /**
   * Finds a user by their ID.
   * @param id - The user's UUID.
   * @returns The user object or null if not found.
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Finds a user by their email.
   * @param email - The user's email.
   * @returns The user object or null if not found.
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Creates a new user.
   * @param data - The user data.
   * @returns The newly created user object.
   */
  async create(
    data: Omit<User, "id" | "createdAt" | "updatedAt">,
  ): Promise<User> {
    return prisma.user.create({
      data,
    });
  }

  /**
   * Deletes a user by their ID.
   * @param id - The user's UUID.
   */
  async deleteMe(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Edits a user's profile by their ID.
   * @param id - The user's UUID.
   * @param newData - The partial user data to update.
   * @returns The updated user object.
   */
  async editMe(id: string, newData: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: newData,
    });
  }
}

export const authRepository = new AuthRepository();
