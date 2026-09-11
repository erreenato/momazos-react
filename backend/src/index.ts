import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conexión a MongoDB
const url = process.env.MONGODB_URI;

mongoose.set("strictQuery", false);
if (url) {
  mongoose
    .connect(url)
    .then(() => {
      console.log("Conectado exitosamente a MongoDB");
    })
    .catch((error) => {
      console.error("Error al conectar a MongoDB:", error.message);
    });
} else {
  console.error("Falta definir MONGODB_URI en el archivo .env");
}

// Ruta de prueba
app.get("/api/ping", (_req, res) => {
  res.send("pong");
});

// Inicialización del Servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});