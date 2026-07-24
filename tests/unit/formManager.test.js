import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FormManager } from '../../js/formManager.js';

describe('FormManager', () => {
  let fm;

  beforeEach(() => {
    fm = new FormManager();
  });

  describe('validateCPF', () => {
    it('aceita exatamente 11 dígitos numéricos com ou sem pontuação', () => {
      expect(fm.validateCPF('12345678901')).toBe(true);
      expect(fm.validateCPF('000.000.000-00')).toBe(true);
      expect(fm.validateCPF('039.894.040-16')).toBe(true);
    });

    it('rejeita string com menos de 11 dígitos numéricos', () => {
      expect(fm.validateCPF('1234567890')).toBe(false);
      expect(fm.validateCPF('')).toBe(false);
    });

    it('rejeita string com mais de 11 dígitos numéricos', () => {
      expect(fm.validateCPF('123456789012')).toBe(false);
    });

    it('rejeita tipos não-string', () => {
      expect(fm.validateCPF(null)).toBe(false);
      expect(fm.validateCPF(undefined)).toBe(false);
      expect(fm.validateCPF(12345678901)).toBe(false);
    });
  });

  describe('formatCPF', () => {
    it('formata 11 dígitos numéricos no padrão 000.000.000-00', () => {
      expect(fm.formatCPF('03989404016')).toBe('039.894.040-16');
      expect(fm.formatCPF('12345678901')).toBe('123.456.789-01');
    });

    it('formata progressivamente conforme o usuário digita', () => {
      expect(fm.formatCPF('039')).toBe('039');
      expect(fm.formatCPF('0398')).toBe('039.8');
      expect(fm.formatCPF('039894')).toBe('039.894');
      expect(fm.formatCPF('039894040')).toBe('039.894.040');
      expect(fm.formatCPF('03989404016')).toBe('039.894.040-16');
    });
  });

  describe('formatDate', () => {
    it('formata 8 dígitos numéricos no padrão DD/MM/AAAA', () => {
      expect(fm.formatDate('10081998')).toBe('10/08/1998');
      expect(fm.formatDate('01012000')).toBe('01/01/2000');
    });

    it('formata progressivamente conforme o usuário digita', () => {
      expect(fm.formatDate('10')).toBe('10');
      expect(fm.formatDate('1008')).toBe('10/08');
      expect(fm.formatDate('10081998')).toBe('10/08/1998');
    });
  });

  describe('generateCode e validateCode', () => {
    it('gera um código de 8 caracteres no padrão 4 num + 1 let + 2 num + 1 let', () => {
      const code = fm.generateCode();
      expect(code).toHaveLength(8);
      expect(fm.validateCode(code)).toBe(true);
    });

    it('valida corretamente o formato do código de uso', () => {
      expect(fm.validateCode('6382b41f')).toBe(true);
      expect(fm.validateCode('1234a56b')).toBe(true);
      expect(fm.validateCode('9999Z00X')).toBe(true);
    });

    it('rejeita códigos com formato ou tamanho inválidos', () => {
      expect(fm.validateCode('12345678')).toBe(false); // sem letras
      expect(fm.validateCode('abcdefgh')).toBe(false); // sem números
      expect(fm.validateCode('6382b41')).toBe(false);  // 7 chars
      expect(fm.validateCode('6382b41ff')).toBe(false); // 9 chars
      expect(fm.validateCode('')).toBe(false);
    });
  });

  describe('validateDate', () => {
    it('aceita datas válidas no formato DD/MM/AAAA', () => {
      expect(fm.validateDate('01/01/2000')).toBe(true);
      expect(fm.validateDate('31/12/2100')).toBe(true);
      expect(fm.validateDate('15/06/1990')).toBe(true);
    });

    it('rejeita dia fora do intervalo', () => {
      expect(fm.validateDate('00/01/2000')).toBe(false);
      expect(fm.validateDate('32/01/2000')).toBe(false);
    });

    it('rejeita mês fora do intervalo', () => {
      expect(fm.validateDate('15/00/2000')).toBe(false);
      expect(fm.validateDate('15/13/2000')).toBe(false);
    });

    it('rejeita ano fora do intervalo', () => {
      expect(fm.validateDate('15/06/1899')).toBe(false);
      expect(fm.validateDate('15/06/2101')).toBe(false);
    });
  });

  describe('validateYear', () => {
    const currentYear = new Date().getFullYear();

    it('aceita ano atual e futuro próximo', () => {
      expect(fm.validateYear(currentYear)).toBe(true);
      expect(fm.validateYear(currentYear + 10)).toBe(true);
    });

    it('rejeita ano anterior ao atual', () => {
      expect(fm.validateYear(currentYear - 1)).toBe(false);
    });
  });

  describe('validate', () => {
    it('retorna isValid=true para dados válidos dentro dos limites de tamanho', () => {
      const result = fm.validate({
        nome: 'Maria Silva', // <= 30
        curso: 'Ciência da Computação', // <= 50
        instituicao: 'Uniritter', // <= 30
        nascimento: '15/03/2000',
        cpf: '039.894.040-16',
        codigo: '6382b41f',
        validade: new Date().getFullYear() + 1
      });
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('retorna erro se o nome exceder 30 caracteres', () => {
      const result = fm.validate({
        nome: 'Este Nome Tem Mais De Trinta Caracteres Aqui',
        curso: 'Curso',
        instituicao: 'Uniritter'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.nome).toBeDefined();
    });

    it('retorna erro se o curso exceder 50 caracteres', () => {
      const result = fm.validate({
        nome: 'Maria',
        curso: 'Este Nome De Curso É Muito Longo E Excede O Limite De Cinquenta Caracteres Permitidos',
        instituicao: 'Uniritter'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.curso).toBeDefined();
    });

    it('retorna erro se a instituição exceder 30 caracteres', () => {
      const result = fm.validate({
        nome: 'Maria',
        curso: 'Computação',
        instituicao: 'Nome De Instituição Com Mais De Trinta Caracteres'
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.instituicao).toBeDefined();
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

    it('aceita JPEG válido e retorna data URL', async () => {
      const file = new File(['fake-image-data'], 'photo.jpg', { type: 'image/jpeg' });
      const result = await fm.processPhoto(file);
      expect(result).toContain('data:');
    });
  });
});
