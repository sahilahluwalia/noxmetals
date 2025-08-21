import { z } from 'zod';

// Individual RFQ item schema
export const RFQItemSchema = z.object({
  material: z.string()
    .min(1, { message: "Please select a material" })
    .refine((val) => ['6061-t6', '7075-t6', '5000-series', '7050-t7451', 'p20-tool-steel', 'other'].includes(val), {
      message: "Please select a valid material option"
    }),
  
  materialSpec: z.string()
    .max(500, { message: "Material specification must be less than 500 characters" })
    .optional()
    .or(z.literal('')),
  
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
  
  quantity: z.string()
    .min(1, { message: "Quantity is required" })
    .refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0 && num <= 10000;
    }, { message: "Quantity must be a positive number less than 10,000" }),
  
  description: z.string()
    .max(1000, { message: "Description must be less than 1000 characters" })
    .optional()
    .or(z.literal(''))
});

// Multi-line RFQ submission schema
export const MultilineRFQSchema = z.object({
  // Contact information
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
  
  // RFQ settings
  additionalNotes: z.string()
    .max(2000, { message: "Additional notes must be less than 2000 characters" })
    .optional()
    .or(z.literal('')),
  
  dfarsRequired: z.boolean(),
  rohsCompliant: z.boolean(),
  
  // Items array
  items: z.array(RFQItemSchema)
    .min(1, { message: "At least one item is required" })
    .max(50, { message: "Maximum 50 items allowed per RFQ" })
});

// Database models for API responses
export const MultilineRFQItemModel = z.object({
  id: z.string().uuid(),
  rfq_id: z.string().uuid(),
  material: z.string(),
  material_spec: z.string().nullable(),
  length: z.number().positive(),
  width: z.number().positive(),
  height: z.number().positive(),
  quantity: z.number().positive().int(),
  description: z.string().nullable(),
  created_at: z.string().datetime()
});

export const MultilineRFQModel = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  full_name: z.string(),
  company: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  additional_notes: z.string().nullable(),
  dfars_required: z.boolean(),
  rohs_compliant: z.boolean(),
  status: z.enum(['pending', 'approved', 'rejected', 'in_progress', 'completed']),
  total_pieces: z.number().int(),
  total_items: z.number().int(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  items: z.array(MultilineRFQItemModel).optional()
});

// Arrays
export const MultilineRFQsArraySchema = z.array(MultilineRFQModel);

// Types inferred from schemas
export type RFQItemData = z.infer<typeof RFQItemSchema>;
export type MultilineRFQData = z.infer<typeof MultilineRFQSchema>;
export type MultilineRFQ = z.infer<typeof MultilineRFQModel>;
export type MultilineRFQItem = z.infer<typeof MultilineRFQItemModel>;
export type MultilineRFQFormErrors = z.inferFlattenedErrors<typeof MultilineRFQSchema>;

// Utility functions
export const formatMultilineRFQZodErrors = (error: z.ZodError) => {
  const flattened = error.flatten();
  return {
    formErrors: flattened.formErrors,
    fieldErrors: flattened.fieldErrors
  };
};

export const getFieldErrorMessage = (fieldErrors: string[] | undefined): string | null => {
  return fieldErrors && fieldErrors.length > 0 ? fieldErrors[0] : null;
};

// Calculate totals helper
export const calculateTotals = (items: RFQItemData[]) => {
  const totalItems = items.length;
  const totalPieces = items.reduce((sum, item) => sum + parseInt(item.quantity), 0);
  return { totalItems, totalPieces };
};

// Material options
export const materialOptions = [
  { value: '6061-t6', label: '6061-T6 Aluminum' },
  { value: '7075-t6', label: '7075-T6 Aluminum' },
  { value: '5000-series', label: '5000 Series Aluminum' },
  { value: '7050-t7451', label: '7050-T7451 Aluminum' },
  { value: 'p20-tool-steel', label: 'P20 Tool Steel' },
  { value: 'other', label: 'Other (specify in description)' }
];
