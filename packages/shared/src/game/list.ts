import { z } from 'zod';

export const MAX_LISTS_PER_USER = 5;

const listNameSchema = z.string().trim().min(1).max(100);
const listDescriptionSchema = z.string().max(1000);

export const createListInputSchema = z.object({
  name: listNameSchema,
  description: listDescriptionSchema.nullable().optional(),
  isPublic: z.boolean().optional(),
});

export type CreateListInput = z.infer<typeof createListInputSchema>;

export const updateListInputSchema = z.object({
  name: listNameSchema.optional(),
  description: listDescriptionSchema.nullable().optional(),
  isPublic: z.boolean().optional(),
});

export type UpdateListInput = z.infer<typeof updateListInputSchema>;

export const addListItemInputSchema = z.object({
  igdbId: z.number().int().positive(),
});

export type AddListItemInput = z.infer<typeof addListItemInputSchema>;

export const listGameSchema = z.object({
  slug: z.string(),
  title: z.string(),
  coverUrl: z.url().nullable(),
  releaseDate: z.iso.datetime().nullable(),
  platforms: z.array(z.string()),
});

export const listItemSchema = z.object({
  id: z.uuid(),
  position: z.number().int(),
  game: listGameSchema,
});

export type ListItemOutput = z.infer<typeof listItemSchema>;

export const gameListSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  isPublic: z.boolean(),
  itemCount: z.number().int().nonnegative(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type GameListSummary = z.infer<typeof gameListSummarySchema>;

export const gameListDetailSchema = gameListSummarySchema.extend({
  items: z.array(listItemSchema),
});

export type GameListDetail = z.infer<typeof gameListDetailSchema>;

export const gameListsOutputSchema = z.object({
  items: z.array(gameListSummarySchema),
});

export type GameListsOutput = z.infer<typeof gameListsOutputSchema>;
