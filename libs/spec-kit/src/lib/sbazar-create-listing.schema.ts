import { z } from 'zod';

export const SbazarCreateListingPayloadSchema = z.object({
  title: z.string().min(3).max(120),
  price: z.number().int().positive(),
  description: z.string().min(10).max(5000),
  imagePaths: z.array(z.string()).optional(),
});

export type SbazarCreateListingPayload = z.infer<
  typeof SbazarCreateListingPayloadSchema
>;

export const SbazarCreateListingTaskSchema = z.object({
  taskType: z.literal('sbazar.createListing'),
  payload: SbazarCreateListingPayloadSchema,
});

export type SbazarCreateListingTask = z.infer<
  typeof SbazarCreateListingTaskSchema
>;

export const SBAZAR_CREATE_LISTING_JSON_SCHEMA = {
  type: 'object',
  required: ['taskType', 'payload'],
  properties: {
    taskType: { type: 'string', enum: ['sbazar.createListing'] },
    payload: {
      type: 'object',
      required: ['title', 'price', 'description'],
      properties: {
        title: { type: 'string', minLength: 3, maxLength: 120 },
        price: { type: 'integer', minimum: 1 },
        description: { type: 'string', minLength: 10, maxLength: 5000 },
        imagePaths: { type: 'array', items: { type: 'string' } },
      },
    },
  },
} as const;
