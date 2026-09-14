import type { Request, Response, NextFunction } from "express"

export const healthCheck = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        res.status(200).send(`DocAssist Server running on port ${process.env.PORT}`);
        return;
    } catch (error) {
        next(error)
    }
}