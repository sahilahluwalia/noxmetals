import { z } from 'zod';

// Quote form submission schema
export const QuoteFormSchema = z.object({
  fullName: z.string()
    .min(2, { message: "Full name must be at least 2 characters" })
    .max(100, { message: "Full name must be less than 100 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, { message: "Full name can only contain letters, spaces, hyphens, and apostrophes" }),
  
  company: z.string()
    .min(2, { message: "Company name must be at least 2 characters" })
    .max(150, { message: "Company name must be less than 150 characters" }),
  
  email: z.string()
    .email({ message: "Please enter a valid email address" })
    .max(254, { message: "Email address is too long" }),
  
  phone: z.string()
    .min(10, { message: "Phone number is required and must be at least 10 digits" })
    .refine((val) => {
      // Basic phone validation - allows various formats
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      const cleanPhone = val.replace(/[\s\-\(\)\.]/g, '');
      return phoneRegex.test(cleanPhone) && cleanPhone.length >= 10;
    }, { message: "Please enter a valid phone number (at least 10 digits)" }),
  
  length: z.string()
    .min(1, { message: "Length is required" })
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 1000;
    }, { message: "Length must be a positive number less than 1000 inches" }),
  
  width: z.string()
    .min(1, { message: "Width is required" })
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 1000;
    }, { message: "Width must be a positive number less than 1000 inches" }),
  
  height: z.string()
    .min(1, { message: "Height is required" })
    .refine((val) => {
      const num = parseFloat(val);
      return !isNaN(num) && num > 0 && num <= 1000;
    }, { message: "Height must be a positive number less than 1000 inches" }),
  
  material: z.string()
    .min(1, { message: "Please select a material" })
    .refine((val) => ['6061-t6', '7075-t6', '5000-series', '7050-t7451', 'p20-tool-steel', 'other'].includes(val), {
      message: "Please select a valid material option"
    }),
  
  qty: z.string()
    .min(1, { message: "Quantity is required" })
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0 && num <= 10000;
    }, { message: "Quantity must be a positive number less than 10,000" }),
  
  materialSpec: z.string()
    .max(500, { message: "Material specification must be less than 500 characters" })
    .optional()
    .or(z.literal('')),
  
  dfarsRequired: z.boolean(),
  
  additionalNotes: z.string()
    .max(2000, { message: "Additional notes must be less than 2000 characters" })
    .optional()
    .or(z.literal(''))
});

// Quote data schema (for API responses)
export const QuoteSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  full_name: z.string(),
  company: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  material: z.string(),
  quantity: z.number().positive().int(),
  material_spec: z.string().nullable(),
  dfars_required: z.boolean(),
  additional_notes: z.string().nullable(),
  status: z.enum(['pending', 'approved', 'rejected', 'in_progress']),
  user_id: z.string().uuid()
});

// Array of quotes schema
export const QuotesArraySchema = z.array(QuoteSchema);

// Types inferred from schemas
export type QuoteFormData = z.infer<typeof QuoteFormSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type QuoteFormErrors = z.inferFlattenedErrors<typeof QuoteFormSchema>;

// Utility function to format validation errors for UI display
export const formatZodErrors = (error: z.ZodError) => {
  const flattened = error.flatten();
  return {
    formErrors: flattened.formErrors,
    fieldErrors: flattened.fieldErrors
  };
};

// Custom error messages for specific fields
export const getFieldErrorMessage = (fieldErrors: string[] | undefined): string | null => {
  return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : null;
};
