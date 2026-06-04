import z from 'zod'

export const contactSchema = z.object({
    name: z
        .string()
        .nonempty("Please enter your full name")
        .min(3, "Full name must be at least 3 characters")
        .max(100, "Full name can't be more than 100 characters")
        .regex(/^[a-zA-Z\s]+$/, {
            message: "Full name can only contain letters and spaces",
        }),

    email: z.string().email("Please enter a valid email"),

    subject: z
        .string()
        .nonempty("Please enter a subject"),
    description: z
        .string()
        .max(200, "Description can't be more than 200 characters")
        .optional(),
});

export type ContactDto = z.infer<typeof contactSchema>;