import { describe, it, expect, beforeEach } from 'vitest';
import { PDFGenerator } from '../../js/pdfGenerator.js';

describe('PDFGenerator', () => {
  let generator;

  beforeEach(() => {
    generator = new PDFGenerator();
  });

  it('deve instanciar corretamente', () => {
    expect(generator).toBeDefined();
    expect(typeof generator.generatePDF).toBe('function');
  });

  it('retorna false para dados nulos ou indefinidos', async () => {
    const resNull = await generator.generatePDF(null);
    expect(resNull).toBe(false);

    const resUndefined = await generator.generatePDF(undefined);
    expect(resUndefined).toBe(false);
  });

  it('funciona graciosamente sem erro em ambiente sem window.jspdf', async () => {
    const studentData = {
      nome: 'Emerson Vicosa de Lima',
      curso: 'Ciência da Computação',
      instituicao: 'UNIRITTER',
      cpf: '039.894.040-16',
      nascimento: '10/08/1998',
      codigo: '6382b41f',
      foto: null
    };

    const result = await generator.generatePDF(studentData);
    expect(result).toBe(true);
  });
});
