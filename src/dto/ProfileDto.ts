import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().nonempty("Name is required").min(2, "Min 2 characters").max(32),
});

export type ProfileDto = z.infer<typeof profileSchema>;

export const createUserSchema = z.object({
  name: z.string().nonempty("Full name is required").min(2, "Min 2 characters").max(32),
  email: z.string().email("Please enter a valid email"),
  password: z.string().nonempty("Password is required").min(8, "Min 8 characters"),
  role: z.enum(["admin", "user"] as const, { message: "Please select a role" }),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
