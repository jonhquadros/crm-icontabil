import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

/**
 * Export data to PDF format
 */
export function exportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  fileName: string = 'relatorio'
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Header
  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235); // Primary Blue
  doc.text('iContabil CRM - Sistema Contábil', 14, 15);

  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59); // Dark Slate
  doc.text(title, 14, 23);

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Muted
  const dateStr = `Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`;
  doc.text(dateStr, 14, 28);

  doc.setLineWidth(0.5);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 31, 196, 31);

  // Table
  autoTable(doc, {
    startY: 35,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
    didDrawPage: (data) => {
      // Footer page numbers
      const str = `Página ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
    },
  });

  doc.save(`${fileName}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Export data to Excel XLSX format
 */
export function exportToExcel(
  data: Record<string, any>[],
  sheetName: string = 'Relatório',
  fileName: string = 'relatorio'
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
