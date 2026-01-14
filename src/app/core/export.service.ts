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
    // Validações
    if (!data || !Array.isArray(data)) {
      throw new Error('Dados inválidos para exportação');
    }
    if (data.length === 0) {
      throw new Error('Não há dados para exportar');
    }
    if (!fileName || fileName.trim() === '') {
      throw new Error('Nome do arquivo é obrigatório');
    }

    try {
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
    } catch (error) {
      console.error('Erro ao exportar para Excel:', error);
      throw new Error('Falha ao exportar arquivo Excel');
    }
  }

  /**
   * Exporta dados para CSV
   */
  exportToCSV(data: any[], fileName: string): void {
    // Validações
    if (!data || !Array.isArray(data)) {
      throw new Error('Dados inválidos para exportação');
    }
    if (data.length === 0) {
      throw new Error('Não há dados para exportar');
    }
    if (!fileName || fileName.trim() === '') {
      throw new Error('Nome do arquivo é obrigatório');
    }

    try {
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

        // Cleanup: Revoga o objeto URL após o download
        setTimeout(() => URL.revokeObjectURL(url), 100);
      } else {
        throw new Error('Seu navegador não suporta download de arquivos');
      }
    } catch (error) {
      console.error('Erro ao exportar para CSV:', error);
      throw new Error('Falha ao exportar arquivo CSV');
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
    // Validações
    if (!data || !Array.isArray(data)) {
      throw new Error('Dados inválidos para exportação');
    }
    if (data.length === 0) {
      throw new Error('Não há dados para exportar');
    }
    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      throw new Error('Colunas são obrigatórias para exportação PDF');
    }
    if (!fileName || fileName.trim() === '') {
      throw new Error('Nome do arquivo é obrigatório');
    }
    if (!title || title.trim() === '') {
      throw new Error('Título do documento é obrigatório');
    }

    try {
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
    } catch (error) {
      console.error('Erro ao exportar para PDF:', error);
      throw new Error('Falha ao exportar arquivo PDF');
    }
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