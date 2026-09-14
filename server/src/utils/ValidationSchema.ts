import z from 'zod';

export const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email_number: z.union([
    z.email('InvalId email address').min(1, 'Email is required'),
    z.string().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
  ]),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const signInSchema = z.object({
  email_number: z.union([
    z.email('InvalId email address'),
    z.string().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
  ]),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

const documentationSlugSchema = z.enum([
  'stripe',
  'livekit',
  'nextjs',
]);

export const createConversationSchema = z.object({
  name: z.string().min(1, 'Conversation name is required').optional().default('New Chat'),
  documentation: documentationSlugSchema.optional().default('stripe'),
});

export const updateConversationSchema = z
  .object({
    name: z.string().min(1, 'Conversation name is required').optional(),
    documentation: documentationSlugSchema.optional(),
  })
  .refine((data) => data.name !== undefined || data.documentation !== undefined, {
    message: 'Provide name and/or documentation',
  });

export const updateProfileSchema = z
  .object({
    name: z.string().min(1, 'Name is required').optional(),
    email: z.email('Invalid email address').optional(),
    photo: z.union([z.url('Invalid photo URL'), z.literal('')]).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.photo !== undefined,
    { message: 'Provide at least one field to update' },
  );

export { documentationSlugSchema };

export const classifyDocumentationSchema = z.object({
  query: z.string().min(1, 'Query is required').max(4000),
});

export const createMessageSchema = z
  .object({
    conversationId: z.string().optional(),
    content: z.string().optional().default(''),
    provider: z.enum(['groq']).default('groq'),
    model: z.string().optional().default('openai/gpt-oss-120b'),
    documentation: documentationSlugSchema.optional(),
    media: z
      .array(
        z.object({
          url: z.string().url('Invalid media URL'),
          mimeType: z.string().min(1, 'Media mimeType is required'),
          fileName: z.string().optional(),
          mediaType: z.enum(['image', 'audio', 'video', 'document']).optional(),
        }),
      )
      .optional()
      .default([]),
  })
  .superRefine((data, ctx) => {
    const hasText = data.content.trim().length > 0;
    const hasMedia = data.media.length > 0;
    if (!hasText && !hasMedia) {
      ctx.addIssue({
        path: ['content'],
        message: 'Message content or media is required',
        code: 'custom',
      });
    }
  });
