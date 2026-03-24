import "dotenv/config";
import app from "./app";
import { connectDB } from "./config/database";
import { initClamAv } from "./config/clamav";
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // 1. Inicializar BD
  await connectDB();

  // 2. Inicializar Antivirus
  // await initClamAv();

  // 3. Iniciar el servidor Express
  app.listen(PORT, () => {
    console.log(
      `🚀 Servidor backend TypeScript escuchando en http://localhost:${PORT}`,
    );
  });
};

startServer();
