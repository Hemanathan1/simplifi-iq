const { z } = require('zod');

const leadSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .trim(),

  email: z
    .string()
    .email('Invalid email address')
    .toLowerCase()
    .trim(),

  company: z
    .string()
    .min(2, 'Company name must be at least 2 characters')
    .max(150, 'Company name too long')
    .trim(),

  companyUrl: z
    .string()
    .url('Must be a valid URL (include https://)')
    .trim()
    .optional()
    .or(z.literal('')),

  industry: z
    .string()
    .max(100)
    .trim()
    .optional(),

  role: z
    .string()
    .max(100, 'Role too long')
    .trim()
    .optional(),

  message: z
    .string()
    .max(1000, 'Message too long')
    .trim()
    .optional(),
});

module.exports = { leadSchema };
