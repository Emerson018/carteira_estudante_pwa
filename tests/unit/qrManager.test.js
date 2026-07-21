import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QRManager } from '../../js/qrManager.js';

describe('QRManager', () => {
  let qrManager;

  beforeEach(() => {
    qrManager = new QRManager();
  });

  describe('buildQRData', () => {
    it('deve montar URL para o documento PDF online', () => {
      const result = qrManager.buildQRData({
        nome: 'Maria Silva',
        cpf: '12345678901',
        codigo: '6382b41f'
      });

      expect(result).toContain('/assets/referencia/certificado.pdf');
      expect(result).toContain('code=6382b41f');
      expect(result).toContain('cpf=12345678901');
      expect(result).toContain('nome=Maria%20Silva');
    });

    it('deve incluir nome completo codificado e código de uso', () => {
      const result = qrManager.buildQRData({
        nome: 'José Araújo da Conceição',
        cpf: '98765432100',
        codigo: 'ABC12345'
      });

      expect(result).toContain('code=abc12345');
      expect(result).toContain('nome=Jos%C3%A9%20Ara%C3%BAjo%20da%20Concei%C3%A7%C3%A3o');
    });

    it('deve usar código padrão se código não for fornecido', () => {
      const result = qrManager.buildQRData({
        nome: 'Ana',
        cpf: '11122233344'
      });

      expect(result).toContain('code=6382b41f');
    });
  });

  describe('generate', () => {
    let canvas;
    let placeholder;

    beforeEach(() => {
      // Setup DOM elements
      document.body.innerHTML = `
        <canvas id="qr-canvas" width="80" height="80"></canvas>
        <div id="qr-placeholder" style="display: none;">QR</div>
      `;
      canvas = document.getElementById('qr-canvas');
      placeholder = document.getElementById('qr-placeholder');
    });

    it('deve retornar false e mostrar placeholder quando QRCode global não está disponível', () => {
      // QRCode is not defined in test env by default
      const result = qrManager.generate({
        nome: 'Maria Silva',
        cpf: '12345678901',
        validade: 2026
      });

      expect(result).toBe(false);
      expect(canvas.style.display).toBe('none');
      expect(placeholder.style.display).toBe('flex');
    });

    it('deve retornar true e mostrar canvas quando QRCode está disponível e geração funciona', () => {
      // Mock global QRCode
      globalThis.QRCode = {
        toCanvas: vi.fn()
      };

      const result = qrManager.generate({
        nome: 'Maria Silva',
        cpf: '12345678901',
        codigo: '6382b41f'
      });

      expect(result).toBe(true);
      expect(canvas.style.display).toBe('block');
      expect(placeholder.style.display).toBe('none');
      expect(globalThis.QRCode.toCanvas).toHaveBeenCalledWith(
        canvas,
        expect.stringContaining('/assets/referencia/certificado.pdf'),
        { width: 80, margin: 1, errorCorrectionLevel: 'M' }
      );

      delete globalThis.QRCode;
    });

    it('deve retornar false e mostrar placeholder quando QRCode.toCanvas lança erro', () => {
      globalThis.QRCode = {
        toCanvas: vi.fn(() => { throw new Error('Falha na geração'); })
      };

      const result = qrManager.generate({
        nome: 'Maria Silva',
        cpf: '12345678901',
        validade: 2026
      });

      expect(result).toBe(false);
      expect(canvas.style.display).toBe('none');
      expect(placeholder.style.display).toBe('flex');

      delete globalThis.QRCode;
    });

    it('deve chamar buildQRData com os parâmetros fornecidos', () => {
      globalThis.QRCode = {
        toCanvas: vi.fn()
      };

      const spy = vi.spyOn(qrManager, 'buildQRData');

      qrManager.generate({
        nome: 'Teste Nome',
        cpf: '99988877766',
        validade: 2030
      });

      expect(spy).toHaveBeenCalledWith({
        nome: 'Teste Nome',
        cpf: '99988877766',
        validade: 2030
      });

      delete globalThis.QRCode;
    });

    it('deve usar opções de QR corretas: width 80, margin 1, errorCorrectionLevel M', () => {
      globalThis.QRCode = {
        toCanvas: vi.fn()
      };

      qrManager.generate({
        nome: 'Aluno',
        cpf: '11111111111',
        validade: 2026
      });

      const callArgs = globalThis.QRCode.toCanvas.mock.calls[0];
      expect(callArgs[2]).toEqual({
        width: 80,
        margin: 1,
        errorCorrectionLevel: 'M'
      });

      delete globalThis.QRCode;
    });
  });
});
