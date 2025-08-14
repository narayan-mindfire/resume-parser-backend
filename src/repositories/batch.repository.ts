import { Batch, PrismaClient } from "../../generated/prisma";

const prisma = new PrismaClient();
/**
 * Creates a new batch record in the database.
 * @param {string} userId The ID of the user who initiated the upload.
 * @returns {Promise<Batch>} The newly created batch object.
 */
export const create = async (userId: string): Promise<Batch> => {
  return prisma.batch.create({
    data: {
      userId,
    },
  });
};

export const fetchMyBatches = async (userId: string): Promise<Batch[]> => {
  return prisma.batch.findMany({
    where: {
      userId,
    },
  });
};
