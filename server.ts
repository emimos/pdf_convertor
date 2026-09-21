import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { execFile } from "child_process";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "70mb" }));
  app.use(express.urlencoded({ extended: true, limit: "70mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get("/api/python-info", (req, res) => {
    execFile("python3", ["--version"], (err, stdout, stderr) => {
      if (err) {
        return res.status(500).json({ error: "Python not available", details: err.message });
      }
      const version = (stdout || stderr).trim();
      res.json({
        pythonVersion: version,
        path: process.env.PATH,
        system: process.platform,
        supportedEngines: [
          "Python 3 Standard Library (Zero External Dependencies)",
          "PIL / Pillow (Reference Code Provided)",
          "img2pdf (Reference Code Provided)",
          "ReportLab (Reference Code Provided)"
        ]
      });
    });
  });

  app.get("/api/download-python-script", (req, res) => {
    const scriptPath = path.join(process.cwd(), "scripts", "converter.py");
    if (fs.existsSync(scriptPath)) {
      res.setHeader("Content-Disposition", 'attachment; filename="image_to_pdf_converter.py"');
      res.setHeader("Content-Type", "text/x-python");
      fs.createReadStream(scriptPath).pipe(res);
    } else {
      res.status(404).send("Script file not found");
    }
  });

  app.post("/api/convert", async (req, res) => {
    try {
      const {
        images,
        pageSize = "A4",
        orientation = "auto",
        margin = 20,
        fit = "contain",
        title = "Converted Images",
        author = "Python Image-to-PDF Converter",
        pageNumbers = false,
      } = req.body;

      if (!images || !Array.isArray(images) || images.length === 0) {
        return res.status(400).json({ error: "No images provided for conversion." });
      }

      // Create unique temporary workspace directory
      const tmpDir = path.join(os.tmpdir(), `img2pdf_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      const pageConfigs: Array<{ path: string; name: string; rotation: number }> = [];

      // Write each image to temporary directory
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        const dataUrl = item.dataUrl || item.base64 || "";
        
        let ext = "jpg";
        let base64Data = dataUrl;

        const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
        if (matches) {
          const rawExt = matches[1].toLowerCase();
          ext = rawExt === "png" ? "png" : "jpg";
          base64Data = matches[2];
        }

        const fileName = `page_${i}.${ext}`;
        const filePath = path.join(tmpDir, fileName);
        const buffer = Buffer.from(base64Data, "base64");
        fs.writeFileSync(filePath, buffer);

        pageConfigs.push({
          path: filePath,
          name: item.name || `Image_${i + 1}`,
          rotation: item.rotation || 0,
        });
      }

      const outputPdfPath = path.join(tmpDir, "output.pdf");
      const configObj = {
        pages: pageConfigs,
        pageSize,
        orientation,
        margin: Number(margin),
        fit,
        title,
        author,
        pageNumbers: Boolean(pageNumbers),
        output: outputPdfPath,
      };

      const configFilePath = path.join(tmpDir, "config.json");
      fs.writeFileSync(configFilePath, JSON.stringify(configObj, null, 2));

      const scriptPath = path.join(process.cwd(), "scripts", "converter.py");

      // Execute Python 3 converter script
      const startTime = Date.now();
      execFile("python3", [scriptPath, "--config", configFilePath], { timeout: 30000 }, (error, stdout, stderr) => {
        const totalDurationMs = Date.now() - startTime;

        if (error) {
          console.error("Python conversion failed:", stderr || error.message);
          // Clean up
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          return res.status(500).json({
            error: "Python conversion process failed",
            details: stderr || error.message,
          });
        }

        if (!fs.existsSync(outputPdfPath)) {
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
          return res.status(500).json({
            error: "PDF output file was not produced by Python script.",
            logs: stdout,
          });
        }

        const pdfBuffer = fs.readFileSync(outputPdfPath);
        const pdfBase64 = pdfBuffer.toString("base64");

        let stats = {};
        try {
          stats = JSON.parse(stdout.trim());
        } catch {
          stats = { stdout };
        }

        // Clean up
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

        return res.json({
          success: true,
          pdfBase64,
          fileName: (title || "converted_images").replace(/[^a-zA-Z0-9_-]/g, "_") + ".pdf",
          sizeBytes: pdfBuffer.length,
          pageCount: images.length,
          durationMs: totalDurationMs,
          stats,
          pythonOutput: stdout.trim(),
        });
      });
    } catch (err: any) {
      console.error("Server conversion error:", err);
      res.status(500).json({ error: "Internal server error", details: err.message });
    }
  });

  // Run custom python code test/inspection endpoint
  app.post("/api/run-python", (req, res) => {
    const { code } = req.body;
    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "No Python code provided" });
    }

    // Safety checks: restrict filesystem deletion or network manipulation
    const bannedTokens = ["import shutil", "rmtree", "os.system('rm", "mkfs", "forkbomb", ":(){ :|:& };:"];
    for (const token of bannedTokens) {
      if (code.includes(token)) {
        return res.status(403).json({ error: `Command not allowed for security reasons: ${token}` });
      }
    }

    const tmpFile = path.join(os.tmpdir(), `test_py_${Date.now()}.py`);
    fs.writeFileSync(tmpFile, code, "utf8");

    const startTime = Date.now();
    execFile("python3", [tmpFile], { timeout: 8000 }, (error, stdout, stderr) => {
      const durationMs = Date.now() - startTime;
      try { fs.unlinkSync(tmpFile); } catch {}

      res.json({
        success: !error,
        stdout: stdout || "",
        stderr: stderr || (error ? error.message : ""),
        exitCode: error ? (error.code ?? 1) : 0,
        durationMs,
      });
    });
  });

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
    console.log(`Image to PDF Converter server listening on port ${PORT}`);
  });
}

startServer();
