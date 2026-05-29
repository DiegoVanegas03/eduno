import winston from "winston";
import "winston-daily-rotate-file";
import path from "path";

// Definir los niveles de severidad
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// El nivel se determina según el entorno
const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "warn";
};

// Colores para la consola
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

winston.addColors(colors);

// Formato de los logs
const format = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
  )
);

// Formato específico para la consola (con colores)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
  winston.format.printf(
    (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
  )
);

// Directorio de logs
const logDir = path.join(__dirname, "../../logs");

// Transportes (dónde se guardarán/mostrarán los logs)
const transports = [
  // Mostrar logs en la consola
  new winston.transports.Console({
    format: consoleFormat,
  }),
  
  // Archivo rotativo para TODOS los logs (crea un archivo nuevo cada día)
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, "application-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "14d", // Guarda logs de los últimos 14 días
    format,
  }),

  // Archivo rotativo SÓLO para ERRORES
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, "error-%DATE%.log"),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: "20m",
    maxFiles: "30d", // Guarda logs de errores por 30 días
    level: "error",
    format,
  }),
];

// Crear la instancia del logger
export const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

// Wrapper para enviar los logs de Morgan a Winston
export const stream = {
  write: (message: string) => {
    // Eliminamos el salto de línea al final que añade Morgan
    logger.http(message.trim());
  },
};
