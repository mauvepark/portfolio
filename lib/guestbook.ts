import { z } from 'zod';

// Doodles live in a fixed 320x240 box so every entry renders at the same scale.
export const DOODLE_W = 320;
export const DOODLE_H = 240;
export const MAX_STROKES = 150;
export const MAX_POINTS = 3000;

export const strokeSchema = z.object({
  c: z.union([z.literal(0), z.literal(1)]),
  p: z
    .array(z.number().int().min(0).max(DOODLE_W))
    .min(2)
    .refine((p) => p.length % 2 === 0, 'points come in x,y pairs'),
});

export const entrySchema = z
  .object({
    name: z.string().trim().min(1, 'Add your name').max(40),
    message: z.string().trim().max(280).default(''),
    doodle: z
      .array(strokeSchema)
      .max(MAX_STROKES)
      .refine((s) => s.reduce((n, st) => n + st.p.length / 2, 0) <= MAX_POINTS, 'Doodle is too detailed'),
    website: z.string().max(0).optional(), // honeypot: real visitors never see this field
  })
  .refine((e) => e.message.length > 0 || e.doodle.length > 0, 'Draw something or leave a note');

export type Stroke = z.infer<typeof strokeSchema>;
export type Entry = {
  id: string;
  name: string;
  message: string;
  doodle: Stroke[];
  created_at: string;
};

export const PUBLIC_COLUMNS = 'id, name, message, doodle, created_at';
export const PAGE_SIZE = 12;
