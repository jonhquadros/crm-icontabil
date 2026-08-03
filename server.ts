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

// Request logger middleware
app.use((req, res, next) => {
  console.log(`[SERVER_REQ] ${req.method} ${req.url}`);
  next();
});

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

    // Fallback: Save file to local uploads directory so we can return a local URL instead of a huge Base64 string that violates Firestore's 1MB limit.
    try {
      const uploadsDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // Generate a unique safe filename
      const safeName = `${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const filePath = path.join(uploadsDir, safeName);

      // Write the buffer to disk
      await fs.promises.writeFile(filePath, req.file.buffer);

      // Return the relative URL (which is served statically)
      const fileUrl = `/uploads/${safeName}`;
      return res.json({ url: fileUrl });
    } catch (fsError: any) {
      console.error("Local file saving failed:", fsError);
      // Absolute fallback if disk writing fails
      const mimeType = req.file.mimetype || "application/octet-stream";
      const base64Data = req.file.buffer.toString("base64");
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      return res.json({ url: dataUrl });
    }
  } catch (error: any) {
    console.error("Erro no upload:", error);
    res.status(500).json({ error: error.message || "Erro interno no servidor" });
  }
});

async function startServer() {
  // Serve uploads folder statically
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

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
