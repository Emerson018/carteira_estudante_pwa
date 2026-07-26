/**
 * QRManager — Gera e gerencia o código QR da carteirinha estudantil.
 * Utiliza a biblioteca qrcode.js (global QRCode) para renderização no canvas.
 * @module qrManager
 */

export class QRManager {
  /**
   * Monta a URL direta e ultraleve do PDF (sem parâmetros longos de URL).
   * @param {object} params - Dados do estudante
   * @returns {string} URL limpa do arquivo PDF
   */
  buildQRData({ codigo } = {}) {
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
      ? window.location.origin
      : 'https://carteira-estudante.vercel.app';

    const safeCode = (codigo || '6382b41f').toLowerCase();
    return `${origin}/pdf/${safeCode}.pdf`;
  }

  /**
   * Gera QR code ultraleve e de fácil leitura para o link direto do PDF.
   * @param {object} params - Dados do estudante
   * @returns {boolean} true se gerado com sucesso, false se falhou
   */
  generate(params = {}) {
    const canvas = document.getElementById('qr-canvas');
    const placeholder = document.getElementById('qr-placeholder');

    if (typeof QRCode === 'undefined') {
      this._showPlaceholder(canvas, placeholder);
      return false;
    }

    const data = this.buildQRData(params);

    try {
      QRCode.toCanvas(canvas, data, {
        width: 80,
        margin: 1,
        errorCorrectionLevel: 'L'
      });

      this._showCanvas(canvas, placeholder);
      return true;
    } catch {
      this._showPlaceholder(canvas, placeholder);
      return false;
    }
  }

  /**
   * Exibe o canvas e esconde o placeholder.
   * @param {HTMLCanvasElement|null} canvas
   * @param {HTMLElement|null} placeholder
   * @private
   */
  _showCanvas(canvas, placeholder) {
    if (canvas) {
      canvas.style.display = 'block';
    }
    if (placeholder) {
      placeholder.style.display = 'none';
    }
  }

  /**
   * Exibe o placeholder e esconde o canvas.
   * @param {HTMLCanvasElement|null} canvas
   * @param {HTMLElement|null} placeholder
   * @private
   */
  _showPlaceholder(canvas, placeholder) {
    if (canvas) {
      canvas.style.display = 'none';
    }
    if (placeholder) {
      placeholder.style.display = 'flex';
    }
  }
}
