import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z
    .string()
    .regex(
      /^\+[1-9]\d{6,14}$/,
      "Must be E.164 format (e.g., +212612345678)"
    ),
  notes: z.string().optional(),
  isGroup: z.boolean().optional().default(false),
  tags: z.string().optional(),
});

export const campaignSchema = z.object({
  name: z.string().min(1).max(200),
  messageTemplate: z.string().min(1).max(4096),
  contactListId: z.string().min(1),
  startDate: z.string().datetime(),
  spreadOverDays: z.number().int().min(1).max(365),
  intervalSeconds: z.number().int().min(60).max(86400).optional().default(300),
});

export const settingsSchema = z.object({
  wasenderApiKey: z.string().min(1).optional(),
  defaultIntervalSeconds: z.number().int().min(60).max(86400).optional(),
  maxMessagesPerDay: z.number().int().min(1).max(1000).optional(),
});

export const contactListSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
});
