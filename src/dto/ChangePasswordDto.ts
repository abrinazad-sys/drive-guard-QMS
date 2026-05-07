import { z } from "zod";

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().optional(),
    newPassword: z.string().nonempty("New password is required").min(8, "Min 8 characters"),
    confirmPassword: z.string().nonempty("Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine((data) => !data.oldPassword || data.oldPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
