const { z } = require('zod');

const createUserSchema = z.object({
    body: z.object({
        first_name: z.string().min(2),
        last_name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        role: z.enum(['admin', 'manager', 'employee']),
        office_id: z.string().uuid().optional().nullable(),
    })
});

const updateUserSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        first_name: z.string().min(2).optional(),
        last_name: z.string().min(2).optional(),
        email: z.string().email().optional(),
        role: z.enum(['admin', 'manager', 'employee']).optional(),
        office_id: z.string().uuid().optional().nullable(),
    })
});

module.exports = {
    createUserSchema,
    updateUserSchema
};
