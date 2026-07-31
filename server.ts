import express from "express";
import path from "path";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { createServer as createViteServer } from "vite";
import fs from "fs";

// Ensure environment variables are loaded
import "dotenv/config";

const app = express();
const PORT = 3000;

// Configure Cloudinary conditionally
const cloudName = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.VITE_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.VITE_CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET;

if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
}

// Configure Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// API routes
app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado" });
    }

    const companyId = req.body.companyId;
    if (!companyId) {
      return res.status(400).json({ error: "companyId é obrigatório" });
    }

    // Check if Cloudinary is configured
    if (cloudName && apiKey && apiSecret) {
      try {
        const baseFolder = process.env.VITE_CLOUDINARY_FOLDER || "crm-icontabil";
        const folderPath = `${baseFolder}/${companyId}`;

        // Upload to Cloudinary using a buffer stream
        const uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: folderPath,
              resource_type: "auto",
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          uploadStream.end(req.file!.buffer);
        });

        return res.json({ url: (uploadResult as any).secure_url });
      } catch (cloudinaryError: any) {
        console.warn("Cloudinary upload failed, falling back to Data URL:", cloudinaryError.message || cloudinaryError);
      }
    }

    // Fallback: Generate a base64 Data URL so upload always succeeds even without Cloudinary keys
    const mimeType = req.file.mimetype || "application/octet-stream";
    const base64Data = req.file.buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return res.json({ url: dataUrl });
  } catch (error: any) {
    console.error("Erro no upload:", error);
    res.status(500).json({ error: error.message || "Erro interno no servidor" });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
