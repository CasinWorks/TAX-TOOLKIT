import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

/**
 * Rasterizes a DOM node to A4 PDF (scales to fit one page).
 */
export async function downloadElementAsPdf(element, filename) {
  if (!element) return;

  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    useCORS: true,
    backgroundColor: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const maxW = pageW - 2 * margin;
  const maxH = pageH - 2 * margin;

  let imgW = maxW;
  let imgH = (canvas.height * imgW) / canvas.width;
  if (imgH > maxH) {
    imgH = maxH;
    imgW = (canvas.width * imgH) / canvas.height;
  }

  const x = (pageW - imgW) / 2;
  const y = margin;
  pdf.addImage(imgData, "PNG", x, y, imgW, imgH);
  pdf.save(filename);
}
