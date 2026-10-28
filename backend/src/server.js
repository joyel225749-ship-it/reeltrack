import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import movieRoutes from "./routes/movieRoutes.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "ReelTrack API is running", data: { status: "ok" } });
});
app.use("/api/movies", movieRoutes);
app.use((req, res) => res.status(404).json({ success: false, message: "Endpoint not found", data: null }));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === 11000) {
    return res.status(409).json({ success: false, message: "A movie with this title and release year already exists.", data: null });
  }
  const status = err.status || (err.name === "ValidationError" || err.name === "CastError" ? 400 : 500);
  return res.status(status).json({
    success: false,
    message: err.message || "Unexpected server error",
    data: null
  });
});

const port = process.env.PORT || 5000;
if (!process.env.MONGODB_URI) {
  console.error("Missing MONGODB_URI. Add it to backend/.env.");
  process.exit(1);
}
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(port, () => console.log(`API listening on ${port}`));
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  });
