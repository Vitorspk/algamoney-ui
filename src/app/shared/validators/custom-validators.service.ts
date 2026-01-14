import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Serviço com validadores customizados para formulários
 */
export class CustomValidators {

  /**
   * Valida se a data final é posterior à data inicial
   */
  static dateRange(startDateField: string, endDateField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const startDate = control.get(startDateField)?.value;
      const endDate = control.get(endDateField)?.value;

      if (!startDate || !endDate) {
        return null; // Se alguma data não estiver preenchida, não valida
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (start > end) {
        return { dateRange: { startDate, endDate } };
      }

      return null;
    };
  }

  /**
   * Valida se a data não é futura
   */
  static notFutureDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const inputDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (inputDate > today) {
        return { futureDate: { value: control.value } };
      }

      return null;
    };
  }

  /**
   * Valida se a data não é passada
   */
  static notPastDate(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const inputDate = new Date(control.value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (inputDate < today) {
        return { pastDate: { value: control.value } };
      }

      return null;
    };
  }

  /**
   * Valida valor mínimo para campos numéricos
   */
  static minValue(min: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value && control.value !== 0) {
        return null;
      }

      const value = parseFloat(control.value);

      if (isNaN(value) || value < min) {
        return { minValue: { min, actual: value } };
      }

      return null;
    };
  }

  /**
   * Valida valor máximo para campos numéricos
   */
  static maxValue(max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value && control.value !== 0) {
        return null;
      }

      const value = parseFloat(control.value);

      if (isNaN(value) || value > max) {
        return { maxValue: { max, actual: value } };
      }

      return null;
    };
  }

  /**
   * Valida CPF brasileiro
   */
  static cpf(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const cpf = control.value.replace(/\D/g, '');

      if (cpf.length !== 11) {
        return { cpf: true };
      }

      // Verifica se todos os dígitos são iguais
      if (/^(\d)\1+$/.test(cpf)) {
        return { cpf: true };
      }

      // Validação dos dígitos verificadores
      let sum = 0;
      let remainder;

      for (let i = 1; i <= 9; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (11 - i);
      }

      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cpf.substring(9, 10))) return { cpf: true };

      sum = 0;
      for (let i = 1; i <= 10; i++) {
        sum += parseInt(cpf.substring(i - 1, i)) * (12 - i);
      }

      remainder = (sum * 10) % 11;
      if (remainder === 10 || remainder === 11) remainder = 0;
      if (remainder !== parseInt(cpf.substring(10, 11))) return { cpf: true };

      return null;
    };
  }

  /**
   * Valida CNPJ brasileiro
   */
  static cnpj(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const cnpj = control.value.replace(/\D/g, '');

      if (cnpj.length !== 14) {
        return { cnpj: true };
      }

      // Verifica se todos os dígitos são iguais
      if (/^(\d)\1+$/.test(cnpj)) {
        return { cnpj: true };
      }

      // Validação dos dígitos verificadores
      let size = cnpj.length - 2;
      let numbers = cnpj.substring(0, size);
      const digits = cnpj.substring(size);
      let sum = 0;
      let pos = size - 7;

      for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
      }

      let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (result !== parseInt(digits.charAt(0))) return { cnpj: true };

      size = size + 1;
      numbers = cnpj.substring(0, size);
      sum = 0;
      pos = size - 7;

      for (let i = size; i >= 1; i--) {
        sum += parseInt(numbers.charAt(size - i)) * pos--;
        if (pos < 2) pos = 9;
      }

      result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
      if (result !== parseInt(digits.charAt(1))) return { cnpj: true };

      return null;
    };
  }

  /**
   * Valida se o campo contém apenas letras e espaços
   */
  static onlyLetters(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const pattern = /^[a-zA-ZÀ-ÿ\s]+$/;
      if (!pattern.test(control.value)) {
        return { onlyLetters: true };
      }

      return null;
    };
  }

  /**
   * Valida se o campo não contém apenas espaços em branco
   */
  static noWhitespace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) {
        return null;
      }

      const isWhitespace = (control.value || '').trim().length === 0;
      return isWhitespace ? { whitespace: true } : null;
    };
  }
}