/**
 * QRManager — Gera e gerencia o código QR da carteirinha estudantil.
 * Utiliza a biblioteca qrcode.js (global QRCode) para renderização no canvas.
 * @module qrManager
 */

export class QRManager {
  /**
   * Monta string de dados para codificação no QR.
   * Formato: CIE|Nome:{nome}|CPF:{cpf}|Validade:{validade}
   * @param {object} params
   * @param {string} params.nome - Nome completo do estudante
   * @param {string} params.cpf - CPF (11 dígitos numéricos)
   * @param {number|string} params.validade - Ano de validade
   * @returns {string} String formatada para QR
   */
  buildQRData({ nome, cpf, codigo } = {}) {
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
      ? window.location.origin
      : 'https://carteira-estudante.vercel.app';

    const safeCode = (codigo || '6382b41f').toLowerCase();
    const safeName = nome ? encodeURIComponent(nome) : '';
    const safeCpf = cpf ? encodeURIComponent(cpf) : '';

    return `${origin}/assets/referencia/certificado.pdf?code=${safeCode}&cpf=${safeCpf}&nome=${safeName}`;
  }

  /**
   * Gera QR code com dados do estudante no canvas.
   * @param {object} params
   * @param {string} params.nome - Nome completo
   * @param {string} params.cpf - CPF (11 dígitos)
   * @param {number|string} params.validade - Ano de validade
   * @returns {boolean} true se gerado com sucesso, false se falhou
   */
  generate({ nome, cpf, validade, codigo } = {}) {
    const canvas = document.getElementById('qr-canvas');
    const placeholder = document.getElementById('qr-placeholder');

    // Verifica se a biblioteca QRCode está disponível globalmente
    if (typeof QRCode === 'undefined') {
      this._showPlaceholder(canvas, placeholder);
      return false;
    }

    const data = this.buildQRData({ nome, cpf, validade, codigo });

    try {
      QRCode.toCanvas(canvas, data, {
        width: 80,
        margin: 1,
        errorCorrectionLevel: 'M'
      });

      // Geração bem-sucedida: mostra canvas, esconde placeholder
      this._showCanvas(canvas, placeholder);
      return true;
    } catch {
      // Falha na geração: mostra placeholder, esconde canvas
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
