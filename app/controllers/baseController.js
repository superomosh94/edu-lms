const BaseController = {
    /**
     * Success response handler
     */
    successResponse: (res, data, message = 'Success', statusCode = 200) => {
        res.status(statusCode).json({
            success: true,
            message,
            data,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * Error response handler
     */
    errorResponse: (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
        const response = {
            success: false,
            message,
            timestamp: new Date().toISOString()
        };

        if (errors) {
            response.errors = errors;
        }

        res.status(statusCode).json(response);
    },

    /**
     * Validation error response handler
     */
    validationError: (res, errors) => {
        res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * Not found response handler
     */
    notFound: (res, resource = 'Resource') => {
        res.status(404).json({
            success: false,
            message: `${resource} not found`,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * Unauthorized response handler
     */
    unauthorized: (res, message = 'Unauthorized access') => {
        res.status(401).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * Forbidden response handler
     */
    forbidden: (res, message = 'Access forbidden') => {
        res.status(403).json({
            success: false,
            message,
            timestamp: new Date().toISOString()
        });
    },

    /**
     * Pagination helper
     */
    paginate: (data, page, limit, total) => {
        const totalPages = Math.ceil(total / limit);
        const hasNext = page < totalPages;
        const hasPrev = page > 1;

        return {
            data,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: total,
                hasNext,
                hasPrev,
                nextPage: hasNext ? page + 1 : null,
                prevPage: hasPrev ? page - 1 : null
            }
        };
    },

    /**
     * Sanitize data for response
     */
    sanitize: (data, fieldsToRemove = ['password', '__v', 'createdAt', 'updatedAt']) => {
        if (Array.isArray(data)) {
            return data.map(item => BaseController.sanitize(item, fieldsToRemove));
        }

        if (data && typeof data === 'object') {
            const sanitized = { ...data };
            fieldsToRemove.forEach(field => {
                delete sanitized[field];
            });
            return sanitized;
        }

        return data;
    }
};

module.exports = BaseController;