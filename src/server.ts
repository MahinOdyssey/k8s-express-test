import express, { Request, Response } from "express";
import podRoutes from "./routes/podRoutes";
import jobRoutes from "./routes/jobRoutes";
import configRoutes from "./routes/configMapRoutes";
import pvcRoutes from "./routes/pvcRoutes";

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.use("/", podRoutes);
app.use("/", jobRoutes);
app.use("/", configRoutes);
app.use("/", pvcRoutes);

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Health: GET /health`);
  console.log(`🐳 Pods: GET /pods`);
  console.log(`⚙️  Jobs: GET /jobs`);
  console.log(`📦 ConfigMaps: GET /configmaps`);
  console.log(`💾 PVCs: GET /pvcs`);
});
