import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

import routes from "./routes/index.js";

const allowedOrigins: string[] = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8081",
  "http://192.168.1.11:5173",
  "https://your-backend-name.onrender.com",
  "https://consoli-scan.vercel.app",
  "https://consoli-scan.asherxd10245.workers.dev",
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);

      if (allowedOrigins.includes(origin)) {
        return cb(null, true);
      }

      return cb(new Error("CORS not allowed"));
    },
    credentials: true,
  }),
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", routes.user);

app.get("/ping", async (req, res): Promise<void> => {
  res.send("Consoliscan server is alive!");
});

export default app;
