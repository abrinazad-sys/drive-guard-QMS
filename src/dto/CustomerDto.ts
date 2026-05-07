import { z } from "zod";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(en);

export const COUNTRY_NAMES = Object.values(
    countries.getNames("en", { select: "official" })
) as readonly string[];


export const customerSchema = z.object({
    txFirstName: z
        .string()
        .nonempty("Please enter your full name")
        .min(3, "Full name must be at least 3 characters")
        .max(100, "Full name can't be more than 100 characters")
        .regex(/^[a-zA-Z\s]+$/, {
            message: "Full name can only contain letters and spaces",
        }),

    txEmail: z.email("Please enter a valid email"),

    txPhone: z
        .string()
        .nonempty("Please enter your phone number")
        .max(15, "Phone number can't be more than 15 characters")
        .regex(/^[0-9]+$/, "Phone number must contain digits only"),

    txCountry: z
        .enum(COUNTRY_NAMES, { message: "Please enter your country name" }),

    txOrgName: z
        .string()
        .nonempty("Please enter your organization name")
        .max(100, "Organization name can't be more than 100 characters"),
    
    planCode: z.string(),

    // Using temporarily until backend fields changes for sign up
    txLastName: z.string().optional(),
    txPhoneCountryCode: z.string().optional(),
    password: z.string().optional(),
    txCity: z.string().optional(),
    txStreet1: z.string().optional(),
    txStreet2: z.string().optional(),

});

export type CustomerDto = z.infer<typeof customerSchema>;
