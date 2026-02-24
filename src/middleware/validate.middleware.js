const validate = (schema) => (req, res, next) => {
    try {
        // We validate the body, query, and params against the schema
        // The schema might be a single object (for body) or a nested object
        const result = schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
        });

        if (result.body) req.body = result.body;
        if (result.query) req.query = result.query;
        if (result.params) req.params = result.params;

        next();
    } catch (error) {
        // Log the validation error for server-side debugging
        const issues = error.issues || [];

        return res.status(400).json({
            error: {
                message: 'Validation failed',
                details: issues.map(e => ({
                    path: e.path.join('.'),
                    message: e.message
                }))
            }
        });
    }
};

module.exports = validate;
