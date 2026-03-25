export class ApiResponse<T = any> {
    public readonly statusCode: number;
    public readonly data: T | null;
    public readonly message: string;
    public readonly success: boolean;
    public readonly timestamp: string;

    constructor(
        statusCode: number,
        data: T | null,
        message: string = "Success"
    ) {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = true;
        this.timestamp = new Date().toISOString();
    }

    static success<T>(data: T, message: string = "Success"): ApiResponse<T> {
        return new ApiResponse(200, data, message);
    }

    static created<T>(data: T, message: string = "Created"): ApiResponse<T> {
        return new ApiResponse(201, data, message);
    }

    toJSON() {
        return {
            success: this.success,
            statusCode: this.statusCode,
            message: this.message,
            data: this.data,
            timestamp: this.timestamp,
        };
    }
}