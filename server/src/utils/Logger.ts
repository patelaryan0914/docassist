import winston from "winston";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const { NODE_ENV, LOG_FILES } = process.env;

const consoleFormat = combine(
    colorize(),
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    printf(({ level, message, timestamp, stack, uniqueCode = "Master DB", ...meta }) => {
        const logStack = NODE_ENV !== "production" ? (stack ? `\n${stack}` : "") : "";
        const logMeta = Object.keys(meta).length ? JSON.stringify(meta) : "";
        return `${timestamp} [${uniqueCode}] ${level}: ${message}${logStack} ${logMeta}`;
    })
);

const fileDbFormat = combine(
    errors({ stack: true }),
    timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    json()
);

const transports: winston.transport[] = [
    new winston.transports.Console({
        format: consoleFormat,
    }),
];

const logger = winston.createLogger({
    level: NODE_ENV === "production" ? "info" : "debug",
    transports,
    exceptionHandlers: [
        new winston.transports.File({ filename: "logs/exceptions.log", format: fileDbFormat }),
    ],
    exitOnError: false,
});

const addTransports = () => {
    try {
        if (LOG_FILES === "true") {
            logger.add(
                new winston.transports.File({
                    filename: "logs/error.log",
                    level: "error",
                    format: fileDbFormat,
                })
            );
            logger.add(
                new winston.transports.File({
                    filename: "logs/combined.log",
                    format: fileDbFormat,
                })
            );
            logger.info("File transports added successfully.");
        }
    } catch (error) {
        logger.error("Failed to add transports:", error);
    }
};

export const createLogger = (uniqueCode: string) => {
    return logger.child({ uniqueCode });
};

export { addTransports };
export default logger;
