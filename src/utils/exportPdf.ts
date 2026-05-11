import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportPdfOptions {
  title: string;
  subtitle?: string;
  columns: string[];
  rows: string[][];
  filename: string;
}

/**
 * Generate and download a styled PDF table from the given data.
 * Uses the same visual layout as the on-screen table.
 */
export function exportToPdf({ title, subtitle, columns, rows, filename }: ExportPdfOptions) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(title, 14, 18);

  // Subtitle / timestamp
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(subtitle || `Generated on ${new Date().toLocaleString()}`, 14, 25);

  // Table
  autoTable(doc, {
    startY: 32,
    head: [columns],
    body: rows,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
      lineColor: [226, 232, 240], // slate-200
      lineWidth: 0.3,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [30, 58, 138], // blue-900
      textColor: [255, 255, 255],
      fontStyle: "bold",
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    margin: { left: 14, right: 14 },
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `Page ${i} of ${pageCount}  ·  DriveGuard QMS`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 8,
      { align: "center" },
    );
  }

  doc.save(filename);
}
