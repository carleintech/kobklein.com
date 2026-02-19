/**
 * Onboarding Validation Schemas (Zod)
 *
 * Financial-grade input validation for signup and onboarding flows.
 * First Zod usage in apps/web — establishes validation pattern.
 */

import { z } from "zod";
import type { UserRole } from "../types/roles";

// ── Reusable Field Schemas ──────────────────────────────────────────

export const nameSchema = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters")
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, "Name contains invalid characters");

// Haiti-only phone (for clients, merchants, distributors - all operating in Haiti)
export const phoneHaitiSchema = z
  .string()
  .regex(/^\+509\d{8}$/, "Phone must be in format +509XXXXXXXX (Haiti)");

// International phone (for diaspora - Haitians living abroad)
// Common diaspora countries: US/Canada (+1), France (+33), Dominican Republic (+1-809/829/849)
export const phoneInternationalSchema = z
  .string()
  .regex(
    /^\+(?:1(?:\d{10})|33\d{9}|1809\d{7}|1829\d{7}|1849\d{7}|44\d{10}|590\d{9}|594\d{9})$/,
    "Phone must include country code (e.g., +1XXXXXXXXXX for US/Canada, +33XXXXXXXXX for France)"
  );

// Legacy phoneSchema for backward compatibility (Haiti only)
export const phoneSchema = phoneHaitiSchema;

export const emailSchema = z
  .string()
  .email("Invalid email address")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const handleSchema = z
  .string()
  .min(3, "Handle must be at least 3 characters")
  .max(20, "Handle must be less than 20 characters")
  .regex(/^[a-z0-9_]+$/, "Handle can only contain lowercase letters, numbers, and underscores")
  .transform((val) => val.toLowerCase());

export const transactionPinSchema = z
  .string()
  .regex(/^\d{4,6}$/, "PIN must be 4-6 digits");

export const dateOfBirthSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((val) => {
    const date = new Date(val);
    const age = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return age >= 18 && age <= 120;
  }, "You must be at least 18 years old");

// ── Step 1: Role Selection ──────────────────────────────────────────

export const roleSelectionSchema = z.object({
  role: z.enum(["client", "diaspora", "merchant", "distributor"]),
});

export type RoleSelectionInput = z.infer<typeof roleSelectionSchema>;

// ── Step 2: Base Signup (All Roles) ────────────────────────────────

export const baseSignupSchema = z.object({
  role: z.enum(["client", "diaspora", "merchant", "distributor"]),
  firstName: nameSchema,
  lastName: nameSchema,
  email: emailSchema,
  // Accept both Haiti and international phones — diaspora may have international numbers
  phone: z.union([phoneHaitiSchema, phoneInternationalSchema]),
  password: passwordSchema,
});

export type BaseSignupInput = z.infer<typeof baseSignupSchema>;

// ── Step 3: Role-Specific Onboarding ───────────────────────────────

/**
 * Client (Local Haiti User)
 * Light KYC: basic profile + wallet security
 */
export const clientOnboardingSchema = z.object({
  dateOfBirth: dateOfBirthSchema,
  country: z.string().min(2, "Please select your country"),
  handle: handleSchema,
  transactionPin: transactionPinSchema,
});

export type ClientOnboardingInput = z.infer<typeof clientOnboardingSchema>;

/**
 * Diaspora (International Sender)
 * Enhanced KYC: residence info + tax compliance + remittance details
 */
export const diasporaOnboardingSchema = z.object({
  dateOfBirth: dateOfBirthSchema,
  handle: handleSchema,
  transactionPin: transactionPinSchema,

  // Core required fields
  countryOfResidence: z.string().min(2, "Please select your country of residence"),
  preferredCurrency: z.enum(["USD", "CAD", "EUR"]).default("USD"),

  // Optional fields — collected progressively for KYC compliance
  phone: z.union([phoneHaitiSchema, phoneInternationalSchema]).optional(),
  city: z.string().optional(),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
  taxResidence: z.string().optional(),
  remittancePurpose: z.enum(["family_support", "education", "business", "medical", "other"]).optional(),
  estimatedMonthly: z.number().min(0).max(100000).optional(),
});

export type DiasporaOnboardingInput = z.infer<typeof diasporaOnboardingSchema>;

/**
 * Merchant (Business Account)
 * KYB: business details + payment setup
 * Haiti-based businesses only
 */
export const merchantOnboardingSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be less than 100 characters"),

  phone: phoneHaitiSchema.optional(),

  category: z.enum(["retail", "restaurant", "services", "education", "health", "transport", "agriculture", "other"]).optional(),

  // Business registration (optional for MVP, required later)
  registrationNumber: z.string().optional(),
  taxIdNumber: z.string().optional(),

  // Payment setup
  transactionPin: transactionPinSchema,
});

export type MerchantOnboardingInput = z.infer<typeof merchantOnboardingSchema>;

/**
 * Distributor (Cash Agent)
 * EDD: Enhanced due diligence + location + agent agreement
 * Haiti-based agents only
 */
export const distributorOnboardingSchema = z.object({
  businessName: z
    .string()
    .min(2, "Business/agent name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),

  transactionPin: transactionPinSchema,

  // Optional fields
  phonePublic: z.union([phoneHaitiSchema, z.string().optional()]).optional(),
  locationText: z.string().max(200).optional(),
  coverageArea: z.string().max(500).optional(),
});

export type DistributorOnboardingInput = z.infer<typeof distributorOnboardingSchema>;

// ── Unified Onboarding Input Type ──────────────────────────────────

export type OnboardingInput =
  | ClientOnboardingInput
  | DiasporaOnboardingInput
  | MerchantOnboardingInput
  | DistributorOnboardingInput;

/**
 * Get the appropriate onboarding schema based on role
 */
export function getOnboardingSchema(role: UserRole) {
  switch (role) {
    case "client":
      return clientOnboardingSchema;
    case "diaspora":
      return diasporaOnboardingSchema;
    case "merchant":
      return merchantOnboardingSchema;
    case "distributor":
      return distributorOnboardingSchema;
    default:
      throw new Error(`Unknown role: ${role}`);
  }
}
