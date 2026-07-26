/**
 * QRManager — Gera e gerencia o código QR da carteirinha estudantil.
 * Utiliza a biblioteca qrcode.js (global QRCode) para renderização no canvas.
 * @module qrManager
 */

export class QRManager {
  /**
   * Monta a URL para codificação no QR incluindo todos os parâmetros do estudante.
   * @param {object} params - Dados do estudante
   * @returns {string} URL formatada para o QR code
   */
  buildQRData({ nome, curso, instituicao, nascimento, cpf, validade, codigo } = {}) {
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
      ? window.location.origin
      : 'https://carteira-estudante.vercel.app';

    const safeCode = (codigo || '6382b41f').toLowerCase();

    const params = new URLSearchParams();
    if (nome) params.set('nome', nome);
    if (curso) params.set('curso', curso);
    if (instituicao) params.set('instituicao', instituicao);
    if (cpf) params.set('cpf', cpf);
    if (nascimento) params.set('nascimento', nascimento);
    if (validade) params.set('validade', String(validade));

    const queryString = params.toString();
    return queryString ? `${origin}/pdf/${safeCode}.pdf?${queryString}` : `${origin}/pdf/${safeCode}.pdf`;
  }

  /**
   * Gera QR code com dados completos do estudante no canvas.
   * @param {object} params - Dados completos do estudante
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
        errorCorrectionLevel: 'M'
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
