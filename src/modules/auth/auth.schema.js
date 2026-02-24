const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        firstName: z.string().min(2),
        lastName: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        organizationName: z.string().min(2),
    }),
});

const changePasswordSchema = z.object({
    body: z.object({
        newPassword: z.string().min(8),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
    changePasswordSchema,
};
