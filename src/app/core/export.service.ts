import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  /**
   * Exporta dados para Excel
   */
  exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1'): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Ajustar largura das colunas automaticamente
    const maxWidth = data.reduce((acc, row) => {
      Object.keys(row).forEach(key => {
        const cellLength = row[key] ? row[key].toString().length : 10;
        acc[key] = Math.max(acc[key] || 10, cellLength);
      });
      return acc;
    }, {});

    worksheet['!cols'] = Object.keys(maxWidth).map(key => ({ wch: maxWidth[key] + 2 }));

    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  /**
   * Exporta dados para CSV
   */
  exportToCSV(data: any[], fileName: string): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Exporta dados para PDF
   */
  exportToPDF(
    data: any[],
    columns: { header: string; dataKey: string }[],
    fileName: string,
    title: string
  ): void {
    const doc = new jsPDF();

    // Adicionar título
    doc.setFontSize(18);
    doc.text(title, 14, 22);

    // Adicionar data de geração
    doc.setFontSize(10);
    doc.setTextColor(100);
    const hoje = new Date().toLocaleDateString('pt-BR');
    doc.text(`Gerado em: ${hoje}`, 14, 30);

    // Configurar tabela
    autoTable(doc, {
      head: [columns.map(col => col.header)],
      body: data.map(row => columns.map(col => row[col.dataKey] || '')),
      startY: 35,
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [102, 126, 234], // Azul similar ao tema
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251],
      },
      margin: { top: 35 },
    });

    doc.save(`${fileName}.pdf`);
  }

  /**
   * Formata valores monetários para exportação
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  /**
   * Formata datas para exportação
   */
  formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  }
}