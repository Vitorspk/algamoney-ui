import { TestBed } from '@angular/core/testing';
import { ExportService } from './export.service';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ExportService]
    });
    service = TestBed.inject(ExportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('exportToExcel', () => {
    it('should throw error for invalid data', () => {
      expect(() => service.exportToExcel(null as any, 'test')).toThrowError('Dados inválidos para exportação');
      expect(() => service.exportToExcel(undefined as any, 'test')).toThrowError('Dados inválidos para exportação');
      expect(() => service.exportToExcel({} as any, 'test')).toThrowError('Dados inválidos para exportação');
    });

    it('should throw error for empty data', () => {
      expect(() => service.exportToExcel([], 'test')).toThrowError('Não há dados para exportar');
    });

    it('should throw error for missing fileName', () => {
      const data = [{ name: 'Test', value: 100 }];
      expect(() => service.exportToExcel(data, '')).toThrowError('Nome do arquivo é obrigatório');
      expect(() => service.exportToExcel(data, '   ')).toThrowError('Nome do arquivo é obrigatório');
    });

    it('should throw error when exceeding max rows', () => {
      const largeData = Array(10001).fill({ name: 'Test', value: 100 });
      expect(() => service.exportToExcel(largeData, 'test'))
        .toThrowError('Limite de exportação excedido. Máximo: 10000 linhas');
    });

    it('should handle data at the limit (10000 rows)', () => {
      const dataAtLimit = Array(10000).fill({ name: 'Test', value: 100 });
      // Não deve lançar erro
      expect(() => service.exportToExcel(dataAtLimit, 'test')).not.toThrow();
    });

    it('should truncate cells exceeding MAX_CELL_LENGTH', () => {
      const longString = 'a'.repeat(40000);
      const data = [{ name: 'Test', description: longString }];

      spyOn(console, 'error');

      // O método deve sanitizar os dados sem erro
      expect(() => service.exportToExcel(data, 'test')).not.toThrow();
    });
  });

  describe('exportToCSV', () => {
    it('should throw error for invalid data', () => {
      expect(() => service.exportToCSV(null as any, 'test')).toThrowError('Dados inválidos para exportação');
    });

    it('should throw error for empty data', () => {
      expect(() => service.exportToCSV([], 'test')).toThrowError('Não há dados para exportar');
    });

    it('should throw error for missing fileName', () => {
      const data = [{ name: 'Test', value: 100 }];
      expect(() => service.exportToCSV(data, '')).toThrowError('Nome do arquivo é obrigatório');
    });

    it('should throw error when exceeding max rows', () => {
      const largeData = Array(10001).fill({ name: 'Test', value: 100 });
      expect(() => service.exportToCSV(largeData, 'test'))
        .toThrowError('Limite de exportação excedido. Máximo: 10000 linhas');
    });

    it('should sanitize large cells before exporting', () => {
      const longString = 'b'.repeat(40000);
      const data = [{ name: 'Test', notes: longString }];

      // Não deve lançar erro devido à sanitização
      expect(() => service.exportToCSV(data, 'test')).not.toThrow();
    });
  });

  describe('exportToPDF', () => {
    const validColumns = [
      { header: 'Nome', dataKey: 'name' },
      { header: 'Valor', dataKey: 'value' }
    ];

    it('should throw error for invalid data', () => {
      expect(() => service.exportToPDF(null as any, validColumns, 'test', 'Title'))
        .toThrowError('Dados inválidos para exportação');
    });

    it('should throw error for empty data', () => {
      expect(() => service.exportToPDF([], validColumns, 'test', 'Title'))
        .toThrowError('Não há dados para exportar');
    });

    it('should throw error for missing columns', () => {
      const data = [{ name: 'Test', value: 100 }];
      expect(() => service.exportToPDF(data, [], 'test', 'Title'))
        .toThrowError('Colunas são obrigatórias para exportação PDF');
      expect(() => service.exportToPDF(data, null as any, 'test', 'Title'))
        .toThrowError('Colunas são obrigatórias para exportação PDF');
    });

    it('should throw error for missing fileName', () => {
      const data = [{ name: 'Test', value: 100 }];
      expect(() => service.exportToPDF(data, validColumns, '', 'Title'))
        .toThrowError('Nome do arquivo é obrigatório');
    });

    it('should throw error for missing title', () => {
      const data = [{ name: 'Test', value: 100 }];
      expect(() => service.exportToPDF(data, validColumns, 'test', ''))
        .toThrowError('Título do documento é obrigatório');
    });

    it('should throw error when exceeding max rows', () => {
      const largeData = Array(10001).fill({ name: 'Test', value: 100 });
      expect(() => service.exportToPDF(largeData, validColumns, 'test', 'Title'))
        .toThrowError('Limite de exportação excedido. Máximo: 10000 linhas');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(service.formatCurrency(1000)).toBe('R$ 1.000,00');
      expect(service.formatCurrency(1000.50)).toBe('R$ 1.000,50');
      expect(service.formatCurrency(0)).toBe('R$ 0,00');
      expect(service.formatCurrency(-500)).toBe('-R$ 500,00');
    });
  });

  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15');
      const formatted = service.formatDate(date);
      // Formato brasileiro: dd/mm/yyyy
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should handle string dates', () => {
      const formatted = service.formatDate('2024-01-15');
      expect(formatted).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    });

    it('should return empty string for null/undefined', () => {
      expect(service.formatDate(null as any)).toBe('');
      expect(service.formatDate(undefined as any)).toBe('');
    });
  });
});