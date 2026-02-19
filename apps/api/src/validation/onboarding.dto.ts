/**
 * Onboarding Validation DTOs (class-validator)
 *
 * Financial-grade API request validation for onboarding endpoints.
 * Mirrors the Zod schemas from apps/web but uses class-validator decorators.
 */

import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  MinLength,
  MaxLength,
  Matches,
  IsNumber,
  Min,
  Max,
} from "class-validator";

/**
 * Client Onboarding (Local Haiti User)
 */
export class ClientOnboardingDto {
  @IsDateString()
  dateOfBirth: string;

  @IsString()
  @MinLength(2)
  country: string;

  @IsString()
  @Matches(/^[a-z0-9_]{3,20}$/, {
    message: "Handle must be 3-20 characters (lowercase letters, numbers, underscores only)",
  })
  handle: string;

  @IsString()
  @Matches(/^\d{4,6}$/, {
    message: "Transaction PIN must be 4-6 digits",
  })
  transactionPin: string;
}

/**
 * Diaspora Onboarding (International Sender)
 * Most fields optional for MVP — collected progressively during KYC.
 */
export class DiasporaOnboardingDto {
  @IsDateString()
  dateOfBirth: string;

  @IsString()
  @Matches(/^[a-z0-9_]{3,20}$/, {
    message: "Handle must be 3-20 characters (lowercase letters, numbers, underscores only)",
  })
  handle: string;

  @IsString()
  @Matches(/^\d{4,6}$/, {
    message: "Transaction PIN must be 4-6 digits",
  })
  transactionPin: string;

  @IsString()
  @MinLength(2)
  countryOfResidence: string;

  @IsEnum(["USD", "CAD", "EUR"])
  @IsOptional()
  preferredCurrency?: string;

  // Progressive KYC — optional at signup
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  stateProvince?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  taxResidence?: string;

  @IsOptional()
  @IsEnum(["family_support", "education", "business", "medical", "other"])
  remittancePurpose?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100000)
  estimatedMonthly?: number;
}

/**
 * Merchant Onboarding (Business Account)
 */
export class MerchantOnboardingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(["retail", "food", "restaurant", "services", "education", "health", "transport", "agriculture", "other"])
  category?: string;

  @IsOptional()
  @IsString()
  locationText?: string;

  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @IsOptional()
  @IsString()
  taxIdNumber?: string;

  @IsString()
  @Matches(/^\d{4,6}$/, {
    message: "Transaction PIN must be 4-6 digits",
  })
  transactionPin: string;
}

/**
 * Distributor Onboarding (Cash Agent)
 */
export class DistributorOnboardingDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessName: string;

  @IsString()
  @Matches(/^\d{4,6}$/, {
    message: "Transaction PIN must be 4-6 digits",
  })
  transactionPin: string;

  @IsOptional()
  @IsString()
  phonePublic?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  locationText?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverageArea?: string;
}
