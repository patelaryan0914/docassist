export class ApiError extends Error {
    public statusCode: number;
    public status: string;
    public metadata?: Record<string, any>;

    constructor(
        message: string,
        statusCode: number = 500,
        metadata?: Record<string, any>
    ) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.metadata = metadata;

        Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            statusCode: this.statusCode,
            status: this.status,
            message: this.message,
            metadata: this.metadata,
            stack: process.env.NODE_ENV === "development" ? this.stack : undefined,
        };
    }
    static badRequest(message: string, metadata?: Record<string, any>) {
        return new ApiError(message, 400, metadata);
    }

    static unauthorized(
        message = "Unauthorized",
        metadata?: Record<string, any>
    ) {
        return new ApiError(message, 401, metadata);
    }

    static forbidden(message = "Forbidden", metadata?: Record<string, any>) {
        return new ApiError(message, 403, metadata);
    }

    static notFound(message = "Not Found", metadata?: Record<string, any>) {
        return new ApiError(message, 404, metadata);
    }

    static conflict(message: string, metadata?: Record<string, any>) {
        return new ApiError(message, 409, metadata);
    }

    static internal(
        message = "Internal Server Error",
        metadata?: Record<string, any>
    ) {
        return new ApiError(message, 500, metadata);
    }
}