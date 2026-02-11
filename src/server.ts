import express, { Request, Response } from "express";
import podRoutes from "./routes/podRoutes";
import jobRoutes from "./routes/jobRoutes";

const app = express();
const PORT = 3000;

app.use(express.json());

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "ok", message: "Server is running" });
});

app.use("/", podRoutes);
app.use("/", jobRoutes);

// app.listen(PORT, () => {
//   console.log(`✅ Server running on http://localhost:${PORT}`);
//   console.log(`📊 Health: GET /health`);
//   console.log(`🐳 List pods: GET /pods`);
//   console.log(`➕ Create pod: POST /pods/create`);
//   console.log(`👁️  Create & watch pod: POST /pods/create-and-watch`);
//   console.log(`🔍 Get pod: GET /pods/:namespace/:name`);
//   console.log(`❌ Delete pod: DELETE /pods/:namespace/:name`);
// });

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Health: GET /health`);
  console.log(`🐳 Pods: GET /pods`);
  console.log(`⚙️  Jobs: GET /jobs`);
  console.log(`➕ Create job: POST /jobs/create`);
});
