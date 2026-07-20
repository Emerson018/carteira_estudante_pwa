import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormManager } from '../../js/formManager.js';

describe('FormManager', () => {
  let fm;

  beforeEach(() => {
    fm = new FormManager();
  });

  describe('validateCPF', () => {
    it('aceita exatamente 11 dígitos numéricos', () => {
      expect(fm.validateCPF('12345678901')).toBe(true);
      expect(fm.validateCPF('00000000000')).toBe(true);
      expect(fm.validateCPF('99999999999')).toBe(true);
    });

    it('rejeita string com menos de 11 dígitos', () => {
      expect(fm.validateCPF('1234567890')).toBe(false);
      expect(fm.validateCPF('')).toBe(false);
    });

    it('rejeita string com mais de 11 dígitos', () => {
      expect(fm.validateCPF('123456789012')).toBe(false);
    });

    it('rejeita string com caracteres não numéricos', () => {
      expect(fm.validateCPF('123.456.789-01')).toBe(false);
      expect(fm.validateCPF('1234567890a')).toBe(false);
      expect(fm.validateCPF('abcdefghijk')).toBe(false);
    });

    it('rejeita tipos não-string', () => {
      expect(fm.validateCPF(null)).toBe(false);
      expect(fm.validateCPF(undefined)).toBe(false);
      expect(fm.validateCPF(12345678901)).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('aceita datas válidas no formato DD/MM/AAAA', () => {
      expect(fm.validateDate('01/01/2000')).toBe(true);
      expect(fm.validateDate('31/12/2100')).toBe(true);
      expect(fm.validateDate('15/06/1990')).toBe(true);
    });

    it('aceita limites de dia (01-31)', () => {
      expect(fm.validateDate('01/01/2000')).toBe(true);
      expect(fm.validateDate('31/01/2000')).toBe(true);
    });

    it('rejeita dia fora do intervalo', () => {
      expect(fm.validateDate('00/01/2000')).toBe(false);
      expect(fm.validateDate('32/01/2000')).toBe(false);
    });

    it('aceita limites de mês (01-12)', () => {
      expect(fm.validateDate('15/01/2000')).toBe(true);
      expect(fm.validateDate('15/12/2000')).toBe(true);
    });

    it('rejeita mês fora do intervalo', () => {
      expect(fm.validateDate('15/00/2000')).toBe(false);
      expect(fm.validateDate('15/13/2000')).toBe(false);
    });

    it('aceita limites de ano (1900-2100)', () => {
      expect(fm.validateDate('15/06/1900')).toBe(true);
      expect(fm.validateDate('15/06/2100')).toBe(true);
    });

    it('rejeita ano fora do intervalo', () => {
      expect(fm.validateDate('15/06/1899')).toBe(false);
      expect(fm.validateDate('15/06/2101')).toBe(false);
    });

    it('rejeita formatos incorretos', () => {
      expect(fm.validateDate('2000-01-15')).toBe(false);
      expect(fm.validateDate('15-01-2000')).toBe(false);
      expect(fm.validateDate('1/1/2000')).toBe(false);
      expect(fm.validateDate('')).toBe(false);
    });

    it('rejeita tipos não-string', () => {
      expect(fm.validateDate(null)).toBe(false);
      expect(fm.validateDate(undefined)).toBe(false);
      expect(fm.validateDate(123)).toBe(false);
    });
  });

  describe('validateYear', () => {
    const currentYear = new Date().getFullYear();

    it('aceita ano atual', () => {
      expect(fm.validateYear(currentYear)).toBe(true);
    });

    it('aceita ano atual + 10', () => {
      expect(fm.validateYear(currentYear + 10)).toBe(true);
    });

    it('aceita anos dentro do intervalo', () => {
      expect(fm.validateYear(currentYear + 5)).toBe(true);
    });

    it('rejeita ano anterior ao atual', () => {
      expect(fm.validateYear(currentYear - 1)).toBe(false);
    });

    it('rejeita ano após atual + 10', () => {
      expect(fm.validateYear(currentYear + 11)).toBe(false);
    });

    it('aceita string numérica válida', () => {
      expect(fm.validateYear(String(currentYear))).toBe(true);
    });

    it('rejeita valores não numéricos', () => {
      expect(fm.validateYear('abc')).toBe(false);
      expect(fm.validateYear(NaN)).toBe(false);
      expect(fm.validateYear(Infinity)).toBe(false);
    });
  });

  describe('validate', () => {
    it('retorna isValid=true para dados completos válidos', () => {
      const result = fm.validate({
        nome: 'Maria Silva',
        curso: 'Ciência da Computação',
        instituicao: 'Uniritter',
        nascimento: '15/03/2000',
        cpf: '12345678901',
        validade: new Date().getFullYear() + 1
      });
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('retorna erro para nome vazio', () => {
      const result = fm.validate({ nome: '', curso: 'Curso', instituicao: 'Uniritter', nascimento: '', cpf: '', validade: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.nome).toBeDefined();
    });

    it('retorna erro para curso vazio', () => {
      const result = fm.validate({ nome: 'Teste', curso: '', instituicao: 'Uniritter', nascimento: '', cpf: '', validade: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.curso).toBeDefined();
    });

    it('retorna erro para instituição vazia', () => {
      const result = fm.validate({ nome: 'Teste', curso: 'Curso', instituicao: '', nascimento: '', cpf: '', validade: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.instituicao).toBeDefined();
    });

    it('retorna erro para nascimento inválido', () => {
      const result = fm.validate({ nome: 'Teste', curso: 'Curso', instituicao: 'Uniritter', nascimento: '99/99/9999', cpf: '', validade: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.nascimento).toBeDefined();
    });

    it('retorna erro para CPF inválido', () => {
      const result = fm.validate({ nome: 'Teste', curso: 'Curso', instituicao: 'Uniritter', nascimento: '', cpf: '123', validade: '' });
      expect(result.isValid).toBe(false);
      expect(result.errors.cpf).toBeDefined();
    });

    it('retorna erro para validade inválida', () => {
      const result = fm.validate({ nome: 'Teste', curso: 'Curso', instituicao: 'Uniritter', nascimento: '', cpf: '', validade: 1999 });
      expect(result.isValid).toBe(false);
      expect(result.errors.validade).toBeDefined();
    });

    it('não valida campos opcionais quando vazios', () => {
      const result = fm.validate({ nome: 'Teste', curso: 'Curso', instituicao: 'Uniritter', nascimento: '', cpf: '', validade: '' });
      expect(result.isValid).toBe(true);
    });
  });

  describe('processPhoto', () => {
    it('rejeita arquivo nulo', async () => {
      await expect(fm.processPhoto(null)).rejects.toThrow();
    });

    it('rejeita formato inválido', async () => {
      const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
      await expect(fm.processPhoto(file)).rejects.toThrow('Formato não suportado');
    });

    it('rejeita arquivo maior que 5MB', async () => {
      const largeData = new Uint8Array(5 * 1024 * 1024 + 1);
      const file = new File([largeData], 'big.jpg', { type: 'image/jpeg' });
      await expect(fm.processPhoto(file)).rejects.toThrow('5 MB');
    });

    it('aceita JPEG válido e retorna data URL', async () => {
      const file = new File(['fake-image-data'], 'photo.jpg', { type: 'image/jpeg' });
      const result = await fm.processPhoto(file);
      expect(result).toContain('data:');
    });

    it('aceita PNG válido e retorna data URL', async () => {
      const file = new File(['fake-image-data'], 'photo.png', { type: 'image/png' });
      const result = await fm.processPhoto(file);
      expect(result).toContain('data:');
    });
  });

  describe('constructor e callbacks', () => {
    it('aceita callbacks onFieldChange e onPhotoChange', () => {
      const onField = vi.fn();
      const onPhoto = vi.fn();
      const manager = new FormManager({ onFieldChange: onField, onPhotoChange: onPhoto });
      expect(manager.onFieldChange).toBe(onField);
      expect(manager.onPhotoChange).toBe(onPhoto);
    });

    it('funciona sem callbacks', () => {
      const manager = new FormManager();
      expect(manager.onFieldChange).toBeNull();
      expect(manager.onPhotoChange).toBeNull();
    });
  });

  describe('bindForm e gerenciamento de erros (DOM)', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <form id="edit-form">
          <input id="input-nome" type="text" />
          <span id="error-nome"></span>
          <input id="input-curso" type="text" />
          <span id="error-curso"></span>
          <input id="input-nascimento" type="text" />
          <span id="error-nascimento"></span>
          <input id="input-cpf" type="text" />
          <span id="error-cpf"></span>
          <input id="input-validade" type="number" />
          <span id="error-validade"></span>
          <input id="input-foto" type="file" />
          <span id="error-foto"></span>
        </form>
      `;
    });

    it('faz binding dos campos do formulário', () => {
      const onFieldChange = vi.fn();
      const manager = new FormManager({ onFieldChange });
      manager.bindForm();

      const nomeInput = document.getElementById('input-nome');
      nomeInput.value = 'João';
      nomeInput.dispatchEvent(new Event('input'));

      expect(onFieldChange).toHaveBeenCalledWith('nome', 'João');
    });

    it('mostra erro quando campo nome fica vazio', () => {
      const manager = new FormManager();
      manager.bindForm();

      const nomeInput = document.getElementById('input-nome');
      nomeInput.value = '';
      nomeInput.dispatchEvent(new Event('input'));

      expect(nomeInput.classList.contains('edit-form__input--error')).toBe(true);
      expect(document.getElementById('error-nome').textContent).not.toBe('');
    });

    it('remove erro quando campo se torna válido', () => {
      const manager = new FormManager();
      manager.bindForm();

      const nomeInput = document.getElementById('input-nome');

      // Primeiro fica inválido
      nomeInput.value = '';
      nomeInput.dispatchEvent(new Event('input'));
      expect(nomeInput.classList.contains('edit-form__input--error')).toBe(true);

      // Depois fica válido
      nomeInput.value = 'Maria';
      nomeInput.dispatchEvent(new Event('input'));
      expect(nomeInput.classList.contains('edit-form__input--error')).toBe(false);
      expect(document.getElementById('error-nome').textContent).toBe('');
    });

    it('valida CPF ao atingir 11 caracteres', () => {
      const onFieldChange = vi.fn();
      const manager = new FormManager({ onFieldChange });
      manager.bindForm();

      const cpfInput = document.getElementById('input-cpf');
      cpfInput.value = '12345678901';
      cpfInput.dispatchEvent(new Event('input'));

      expect(onFieldChange).toHaveBeenCalledWith('cpf', '12345678901');
    });

    it('mostra erro para CPF inválido com 11 caracteres', () => {
      const manager = new FormManager();
      manager.bindForm();

      const cpfInput = document.getElementById('input-cpf');
      cpfInput.value = '1234567890a';
      cpfInput.dispatchEvent(new Event('input'));

      expect(cpfInput.classList.contains('edit-form__input--error')).toBe(true);
    });

    it('mantém último valor válido após erro', () => {
      const onFieldChange = vi.fn();
      const manager = new FormManager({ onFieldChange });
      manager.bindForm();

      const nomeInput = document.getElementById('input-nome');

      // Valor válido
      nomeInput.value = 'Maria';
      nomeInput.dispatchEvent(new Event('input'));
      expect(manager.getLastValidValue('nome')).toBe('Maria');

      // Valor inválido (vazio)
      nomeInput.value = '';
      nomeInput.dispatchEvent(new Event('input'));
      // Último valor válido mantido
      expect(manager.getLastValidValue('nome')).toBe('Maria');
    });

    it('não faz binding duplicado', () => {
      const onFieldChange = vi.fn();
      const manager = new FormManager({ onFieldChange });
      manager.bindForm();
      manager.bindForm(); // segunda chamada ignorada

      const nomeInput = document.getElementById('input-nome');
      nomeInput.value = 'Teste';
      nomeInput.dispatchEvent(new Event('input'));

      // Apenas uma chamada (não duplicou listener)
      expect(onFieldChange).toHaveBeenCalledTimes(1);
    });
  });
});
