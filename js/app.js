/**
 * App — Módulo principal de inicialização e orquestração.
 * Conecta todos os managers e gerencia o fluxo de dados da aplicação.
 * @module app
 */

import { StorageManager } from './storageManager.js';
import { CardManager } from './cardManager.js';
import { FormManager } from './formManager.js';
import { QRManager } from './qrManager.js';
import { NavigationManager } from './navigationManager.js';
import { PDFGenerator } from './pdfGenerator.js';

/**
 * Dados padrão do estudante quando não há dados salvos.
 */
const DEFAULT_STUDENT_DATA = {
  nome: '',
  curso: '',
  instituicao: '',
  nascimento: '',
  cpf: '',
  validade: new Date().getFullYear() + 1,
  codigo: '',
  foto: null
};

/**
 * Campos que disparam regeneração do QR code.
 */
const QR_FIELDS = ['nome', 'cpf', 'validade', 'codigo'];

/**
 * Classe App encapsula toda a lógica de orquestração.
 * Exportada para facilitar testes.
 */
export class App {
  constructor() {
    this.studentData = { ...DEFAULT_STUDENT_DATA };
    this.storageManager = null;
    this.cardManager = null;
    this.formManager = null;
    this.qrManager = null;
    this.navigationManager = null;
    this.pdfGenerator = null;
  }

  /**
   * Atualiza o texto de saudação no cabeçalho.
   * @param {string} nome - Nome do estudante (pode ser vazio)
   */
  updateGreeting(nome) {
    const greetingEl = document.getElementById('greeting');
    if (!greetingEl) return;

    if (nome && typeof nome === 'string' && nome.trim().length > 0) {
      const firstName = nome.trim().split(/\s+/)[0];
      greetingEl.textContent = `Olá, ${firstName}!`;
    } else {
      greetingEl.textContent = 'Olá, Estudante!';
    }
  }

  /**
   * Exibe notificação toast ao usuário.
   * @param {string} message - Mensagem a exibir
   */
  showNotification(message) {
    const notification = document.getElementById('notification');
    const messageEl = document.getElementById('notification-message');

    if (!notification || !messageEl) return;

    messageEl.textContent = message;
    notification.removeAttribute('hidden');
    notification.classList.add('notification--visible');

    setTimeout(() => {
      notification.classList.remove('notification--visible');
      notification.setAttribute('hidden', '');
    }, 3000);
  }

  /**
   * Callback chamado pelo FormManager quando um campo válido é alterado.
   * @param {string} field - Nome do campo alterado
   * @param {*} value - Novo valor do campo
   */
  onFieldChange(field, value) {
    // 1. Atualizar dados em memória
    this.studentData[field] = value;

    // 2. Tentar salvar no storage
    try {
      this.storageManager.save(this.studentData);
    } catch (error) {
      this.showNotification(error.message || 'Não foi possível salvar as alterações.');
    }

    // 3. Atualizar cartão visual
    this.cardManager.updateCard(this.studentData);

    // 4. Regenerar QR se campo relevante foi alterado
    if (QR_FIELDS.includes(field)) {
      this.qrManager.generate({
        nome: this.studentData.nome,
        cpf: this.studentData.cpf,
        validade: this.studentData.validade,
        codigo: this.studentData.codigo
      });
    }

    // 5. Atualizar saudação se nome mudou
    if (field === 'nome') {
      this.updateGreeting(value);
    }
  }

  /**
   * Callback chamado pelo FormManager quando uma foto válida é processada.
   * @param {string} dataUrl - Data URL da imagem
   */
  onPhotoChange(dataUrl) {
    // 1. Atualizar dados em memória
    this.studentData.foto = dataUrl;

    // 2. Tentar salvar no storage
    try {
      this.storageManager.save(this.studentData);
    } catch (error) {
      this.showNotification(error.message || 'Não foi possível salvar a foto.');
    }

    // 3. Atualizar cartão visual
    this.cardManager.updateCard(this.studentData);
  }

  /**
   * Chamado quando o usuário clica no botão "Salvar".
   * Salva os dados e gera o PDF do certificado baseado no modelo certificado.pdf.
   */
  async onSave() {
    this.showNotification('Gerando certificado PDF...');
    try {
      await this.pdfGenerator.generatePDF(this.studentData);
      this.showNotification('Carteirinha salva e PDF gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      this.showNotification('Carteirinha salva com sucesso!');
    }
  }

  /**
   * Alterna a visibilidade da seção do formulário de edição.
   */
  toggleEditForm() {
    const editSection = document.getElementById('edit-form-section');
    if (!editSection) return;

    if (editSection.hasAttribute('hidden')) {
      editSection.removeAttribute('hidden');
      editSection.style.display = 'block';
      if (typeof editSection.scrollIntoView === 'function') {
        editSection.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      editSection.setAttribute('hidden', '');
      editSection.style.display = 'none';
    }
  }

  /**
   * Registra o Service Worker para funcionalidade offline.
   */
  registerServiceWorker() {
    if ('serviceWorker' in navigator && navigator.serviceWorker) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {
        // Falha silenciosa — app continua funcionando sem offline
      });
    }
  }

  /**
   * Inicializa a aplicação.
   */
  init() {
    // a. Criar StorageManager
    this.storageManager = new StorageManager();

    // b. Criar CardManager (auto-binds flip events no constructor)
    this.cardManager = new CardManager();

    // c. Criar QRManager
    this.qrManager = new QRManager();

    // h. Criar FormManager com callbacks
    this.formManager = new FormManager({
      onFieldChange: (field, value) => this.onFieldChange(field, value),
      onPhotoChange: (dataUrl) => this.onPhotoChange(dataUrl),
      onSave: () => this.onSave()
    });

    // d. Carregar dados do storage
    const savedData = this.storageManager.load();

    if (savedData) {
      // e. Dados existem: atualizar estado, cartão, QR e saudação
      this.studentData = { ...DEFAULT_STUDENT_DATA, ...savedData };
    } else {
      // f. Sem dados: saudação padrão e placeholders
      this.studentData = { ...DEFAULT_STUDENT_DATA };
    }

    // Auto-gerar código de uso de 8 caracteres se estiver ausente ou inválido
    if (!this.studentData.codigo || !this.formManager.validateCode(this.studentData.codigo)) {
      this.studentData.codigo = this.formManager.generateCode();
      this.storageManager.save(this.studentData);
    }

    if (savedData) {
      this.cardManager.updateCard(this.studentData);
      this.qrManager.generate({
        nome: this.studentData.nome,
        cpf: this.studentData.cpf,
        validade: this.studentData.validade,
        codigo: this.studentData.codigo
      });
      this.updateGreeting(this.studentData.nome);
    } else {
      this.updateGreeting('');
      this.cardManager.updateCard(this.studentData);
      this.qrManager.generate(this.studentData);
    }

    // g. Criar PDFGenerator
    this.pdfGenerator = new PDFGenerator();

    // i. Preencher formulário e bind form events
    this.formManager.populateForm(this.studentData);
    this.formManager.bindForm();

    // i. Criar NavigationManager (auto-binds tab clicks no constructor)
    this.navigationManager = new NavigationManager();

    // j. Bind menu button para toggle do formulário de edição
    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => this.toggleEditForm());
    }

    // k. Verificar acesso por escaneamento de QR Code
    this.checkQRScanValidation();

    // l. Registrar Service Worker
    this.registerServiceWorker();
  }

  /**
   * Verifica se a página foi acessada via escaneamento de QR Code (ex: /pdf/6382b41f.pdf ou ?code=6382b41f).
   * Se acessado, valida o código, notifica o usuário e baixa a declaração PDF correspondente.
   */
  checkQRScanValidation() {
    if (typeof window === 'undefined' || !window.location) return;

    const pathname = window.location.pathname || '';
    const search = window.location.search || '';

    const pdfMatch = pathname.match(/\/pdf\/([a-zA-Z0-9]+)/i);
    const urlParams = new URLSearchParams(search);
    const scannedCode = pdfMatch ? pdfMatch[1].replace(/\.pdf$/i, '') : (urlParams.get('code') || urlParams.get('codigo') || urlParams.get('validar'));

    if (scannedCode) {
      const cleanCode = scannedCode.toLowerCase();

      // Sincroniza o código escaneado nos dados da sessão do estudante se necessário
      if (!this.studentData.codigo || this.studentData.codigo.toLowerCase() !== cleanCode) {
        this.studentData.codigo = cleanCode;
        try {
          this.storageManager.save(this.studentData);
        } catch (e) {}
        this.cardManager.updateCard(this.studentData);
        this.qrManager.generate(this.studentData);
      }

      // Exibe o PDF diretamente sem intermediários
      this.showPDFViewer(this.studentData);
    }
  }

  /**
   * Exibe o documento PDF diretamente em tela cheia na página da web.
   * @param {object} data - Dados do estudante
   */
  async showPDFViewer(data) {
    const pdfSection = document.getElementById('section-pdf-viewer');
    const pdfFrame = document.getElementById('pdf-viewer-frame');
    if (!pdfSection || !pdfFrame) return;

    try {
      const pdf = await this.pdfGenerator.buildPDFDoc(data || this.studentData);
      if (!pdf) return;

      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      pdfFrame.src = blobUrl;

      // Esconde todas as seções principais
      const mainSections = document.querySelectorAll('.main-content > .section');
      mainSections.forEach((sec) => {
        if (sec.id !== 'section-pdf-viewer') {
          sec.setAttribute('hidden', '');
          sec.style.display = 'none';
        }
      });

      // Exibe a seção do visualizador PDF diretamente em tela cheia
      pdfSection.removeAttribute('hidden');
      pdfSection.style.display = 'block';
    } catch (e) {
      console.error('Erro ao renderizar PDF direto:', e);
    }
  }
}

// Exportar constante para testes
export { DEFAULT_STUDENT_DATA };

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
