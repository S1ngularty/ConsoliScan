import multer, { type FileFilterCallback } from "multer";
import type { Request, Response, NextFunction } from "express";

const storage = multer.memoryStorage();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, and WEBP are allowed!",
      ) as any,
      false,
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

export default upload;
