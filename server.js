import express from "express";
import puppeteer from "puppeteer";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

app.post("/generate-pdf", async (req, res) => {
  const { html, title } = req.body;

  if (!html) return res.status(400).json({ error: "HTML missing" });

  try {
   const browser = await puppeteer.launch({
  headless: true,
  args: [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--single-process",
    "--no-zygote",
    "--disable-gpu",
    "--disable-software-rasterizer"
  ],
});


    const page = await browser.newPage();

   await page.waitForTimeout(1000); // wait 1s to ensure images/CSS loaded


    // Add global anti-cut rule
    await page.addStyleTag({
      content: `
        * { page-break-inside: avoid !important; break-inside: avoid !important; }
        img, li, div, p { page-break-inside: avoid !important; }
      `,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
      preferCSSPageSize: true,
    });

    await browser.close();

    res.json({
      success: true,
      filename: `${title || "paper"}.pdf`,
      file: pdfBuffer.toString("base64"),
    });
  } catch (err) {
    console.error("PDF generation failed", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

app.get("/", (req, res) => res.send("✅ Puppeteer PDF API is running"));

app.listen(5000, () => console.log("🚀 Running on port 5000"));
