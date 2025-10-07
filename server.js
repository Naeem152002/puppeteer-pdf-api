import express from "express";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium-min";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

app.get("/", (req, res) => {
  res.send("✅ Puppeteer PDF API (Chromium-min) is running");
});

app.post("/generate-pdf", async (req, res) => {
  const { html, title } = req.body;

  if (!html) return res.status(400).json({ error: "HTML missing" });

  try {
    const executablePath = await chromium.executablePath();

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.waitForTimeout(500);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
    });

    await browser.close();

    res.json({
      success: true,
      filename: `${title || "paper"}.pdf`,
      file: pdfBuffer.toString("base64"),
    });
  } catch (err) {
    console.error("❌ PDF generation failed:", err);
    res.status(500).json({ error: "Failed to generate PDF", details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
