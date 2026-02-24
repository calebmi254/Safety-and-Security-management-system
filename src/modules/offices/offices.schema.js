const { z } = require('zod');

const createOfficeSchema = z.object({
    body: z.object({
        office_name: z.string().min(2, "Office name must be at least 2 characters"),
        office_code: z.string().optional().nullable(),
        office_type: z.string().optional().nullable(),
        country: z.string().min(2),
        state: z.string().optional().nullable(),
        city: z.string().min(2),
        physical_address: z.string().optional().nullable(),
        postal_code: z.string().optional().nullable(),
        latitude: z.number().optional().nullable(),
        longitude: z.number().optional().nullable(),
        timezone: z.string().optional().nullable(),
        branch_manager_id: z.string().uuid().optional().nullable(),
        phone: z.string().optional().nullable(),
        email: z.string().email().optional().nullable().or(z.literal('')),
    })
});

const updateOfficeSchema = z.object({
    body: createOfficeSchema.shape.body.partial()
});

module.exports = {
    createOfficeSchema,
    updateOfficeSchema
};
