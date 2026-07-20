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
const QR_FIELDS = ['nome', 'cpf', 'validade'];

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

    if (nome && nome.trim().length > 0) {
      greetingEl.textContent = `Olá, ${nome.trim()}!`;
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
        validade: this.studentData.validade
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
    } else {
      editSection.setAttribute('hidden', '');
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

    // d. Carregar dados do storage
    const savedData = this.storageManager.load();

    if (savedData) {
      // e. Dados existem: atualizar estado, cartão, QR e saudação
      this.studentData = { ...DEFAULT_STUDENT_DATA, ...savedData };
      this.cardManager.updateCard(this.studentData);
      this.qrManager.generate({
        nome: this.studentData.nome,
        cpf: this.studentData.cpf,
        validade: this.studentData.validade
      });
      this.updateGreeting(this.studentData.nome);
    } else {
      // f. Sem dados: saudação padrão e placeholders
      this.updateGreeting('');
      this.cardManager.updateCard(this.studentData);
    }

    // g. Criar PDFGenerator
    this.pdfGenerator = new PDFGenerator();

    // h. Criar FormManager com callbacks
    this.formManager = new FormManager({
      onFieldChange: (field, value) => this.onFieldChange(field, value),
      onPhotoChange: (dataUrl) => this.onPhotoChange(dataUrl),
      onSave: () => this.onSave()
    });

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

    // k. Registrar Service Worker
    this.registerServiceWorker();
  }
}

// Exportar constante para testes
export { DEFAULT_STUDENT_DATA };

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
