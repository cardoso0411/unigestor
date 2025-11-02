// backend/server.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import itemsRoutes from "./routes/items.js";
import movementsRoutes from "./routes/movements.js";
import uniformesRoutes from "./routes/uniformes.js";
import { db } from "./db.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use("/api/items", itemsRoutes);
app.use("/api/movements", movementsRoutes);
app.use("/api/uniformes", uniformesRoutes);

app.get("/", (req, res) => {
  res.send("🚀 UniGestor API rodando com sucesso!");
});

app.listen(process.env.PORT, () => {
  console.log(`✅ Servidor rodando na porta ${process.env.PORT}`);
});
