import z from 'zod';

export const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email_number: z.union([
    z.email('InvalId email address').min(1, 'Email is required'),
    z.string().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
  ]),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export const signInSchema = z
  .object({
    signInWith: z.enum(['credentials', 'google']),
    email_number: z.union([
      z.email('InvalId email address'),
      z.string().regex(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
    ]).optional(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.signInWith === 'credentials') {
      if (!data.email_number) {
        ctx.addIssue({
          path: ['email_number'],
          message:
            'Email or mobile number is required for this verification type',
          code: 'custom',
        });
      }
      if (!data.password) {
        ctx.addIssue({
          path: ['password'],
          message: 'Password is required for this verification type',
          code: 'custom',
        });
      }
    }
  });

export const googleLoginIdTokenSchema = z.object({
  idToken: z.string().min(1, 'Id Token is required'),
  userType: z.string().min(1, 'User type is required'),
});

export const createConversationSchema = z.object({
  name: z.string().min(1, 'Conversation name is required').optional().default('New Chat'),
});

export const updateConversationSchema = z.object({
  name: z.string().min(1, 'Conversation name is required')
});

export const createMessageSchema = z
  .object({
    conversationId: z.string().optional(),
    content: z.string().optional().default(''),
    provider: z.enum(['openai', 'groq', 'anthropic', 'google']).default('groq'),
    model: z.string().optional().default('openai/gpt-oss-120b'),
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