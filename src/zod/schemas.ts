import { z } from "zod";

export const userSchemaZ = z.object({
  fname: z.string(),
  lname: z.string(),
  email: z.email(),
  password: z.string(),
  bio: z.string().optional(),
  profileImage: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type User = z.infer<typeof userSchemaZ>;
