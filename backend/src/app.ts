import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { clerkMiddleware } from "@clerk/express";

const app = express();

import routes from "./routes/index.js";
import requestLogger from "./middlewares/requestLogger.middleware.js";

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

app.use(requestLogger);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(clerkMiddleware());

app.use("/api", routes.auth);
app.use("/api/v1", routes.user);
app.use("/api/v1", routes.category);
app.use("/api/v1", routes.product);
app.use("/api/v1", routes.catalog);

app.get("/ping", async (req, res): Promise<void> => {
  res.send("Consoliscan server is alive!");
});

export default app;
