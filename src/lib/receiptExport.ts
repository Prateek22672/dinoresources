import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";

/** Rasterizes a receipt DOM node and downloads it as a single-page PDF sized to match it exactly. */
export async function downloadReceiptPdf(node: HTMLElement, filename: string) {
  const scale = 2;
  // JPEG, not PNG: this is flat white paper with text and a soft drop-shadow —
  // exactly the content PNG's lossless compression handles worst (a receipt
  // came out at 6MB as PNG vs a few hundred KB as JPEG, same visual result).
  const dataUrl = await toJpeg(node, { pixelRatio: scale, backgroundColor: "#ffffff", quality: 0.95, cacheBust: true });
  const width = node.offsetWidth * scale;
  const height = node.offsetHeight * scale;
  const pdf = new jsPDF({ unit: "px", format: [width, height] });
  pdf.addImage(dataUrl, "JPEG", 0, 0, width, height);
  pdf.save(filename);
}
