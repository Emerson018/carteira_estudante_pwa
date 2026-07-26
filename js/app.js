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
  foto: null,
  isSaved: false
};

/**
 * Campos que disparam regeneração do QR code.
 */
const QR_FIELDS = ['nome', 'curso', 'instituicao', 'nascimento', 'cpf', 'validade', 'codigo'];

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

  onFieldChange(field, value) {
    this.studentData[field] = value;

    try {
      this.storageManager.save(this.studentData);
    } catch (error) {
      this.showNotification(error.message || 'Não foi possível salvar as alterações.');
    }

    this.cardManager.updateCard(this.studentData);

    if (QR_FIELDS.includes(field)) {
      this.qrManager.generate(this.studentData);
    }

    if (field === 'nome') {
      this.updateGreeting(value);
    }
  }

  async uploadPhotoToServer(code, photoDataUrl) {
    if (!code || !photoDataUrl || typeof window === 'undefined' || !window.fetch) return;
    try {
      await fetch('/api/photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, photo: photoDataUrl })
      });
    } catch (e) {}
  }

  onPhotoChange(dataUrl) {
    this.studentData.foto = dataUrl;

    try {
      this.storageManager.save(this.studentData);
    } catch (error) {
      this.showNotification(error.message || 'Não foi possível salvar a foto.');
    }

    this.uploadPhotoToServer(this.studentData.codigo, dataUrl);
    this.cardManager.updateCard(this.studentData);
    this.qrManager.generate(this.studentData);
  }

  updateOnlinePDFLink(url) {
    const container = document.getElementById('online-link-container');
    const linkEl = document.getElementById('online-pdf-link');
    const copyBtn = document.getElementById('btn-copy-pdf-link');

    if (!url || !linkEl || !container) return;

    linkEl.href = url;
    linkEl.textContent = url;
    container.style.display = 'block';

    if (copyBtn) {
      copyBtn.onclick = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(() => {
            this.showNotification('Link do PDF copiado com sucesso!');
          }).catch(() => {
            this.showNotification('Link do PDF pronto para cópia!');
          });
        } else {
          this.showNotification('Link do PDF pronto para cópia!');
        }
      };
    }
  }

  async saveStudentDataToServer(studentData) {
    if (!studentData || typeof window === 'undefined' || !window.fetch) return null;
    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      });
      if (response.ok) {
        const result = await response.json();
        return result.id || null;
      }
      return null;
    } catch (e) {
      console.warn('Erro ao salvar dados no servidor:', e);
      return null;
    }
  }

  async uploadPDFToCloud(pdfArrayBuffer, studentCode) {
    if (!pdfArrayBuffer || typeof window === 'undefined' || !window.fetch) return null;
    try {
      const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('reqtype', 'fileupload');
      formData.append('time', '72h');
      formData.append('fileToUpload', blob, `declaracao_estudantil_${studentCode || '6382b41f'}.pdf`);

      const response = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const fileUrl = (await response.text()).trim();
        if (fileUrl.startsWith('http')) {
          return fileUrl;
        }
      }
      return null;
    } catch (e) {
      console.warn('Erro ao fazer upload do PDF para a nuvem:', e);
      return null;
    }
  }

  async onSave() {
    this.showNotification('Salvando carteirinha e gerando PDF com foto...');

    try {
      // Marcar como salvo
      this.studentData.isSaved = true;

      // 1. Salvar dados + foto no servidor serverless para obter o objectId único
      const objectId = await this.saveStudentDataToServer(this.studentData);
      if (objectId) {
        this.studentData.objectId = objectId;
        try { this.storageManager.save(this.studentData); } catch (e) {}
      }

      // 2. Construir a URL oficial do PDF (apontando para o documento com a foto)
      const pdfUrl = this.qrManager.buildQRData(this.studentData);

      // 3. Atualizar link online e QR Code na carteirinha (tela)
      this.updateOnlinePDFLink(pdfUrl);
      this.qrManager.generate(this.studentData);

      // 4. Gerar o PDF completo (o QR Code impresso no PDF será 100% IDÊNTICO ao da carteirinha)
      const pdfArrayBuffer = await this.pdfGenerator.generatePDF(this.studentData);

      // 5. Upload em segundo plano do PDF gerado para a nuvem
      if (pdfArrayBuffer) {
        this.uploadPDFToCloud(pdfArrayBuffer, this.studentData.codigo).then(onlinePdfUrl => {
          if (onlinePdfUrl) {
            this.studentData.onlinePdfUrl = onlinePdfUrl;
            try { this.storageManager.save(this.studentData); } catch (e) {}
            this.updateOnlinePDFLink(onlinePdfUrl);
            this.qrManager.generate(this.studentData);
          }
        }).catch(() => {});
      }

      this.showNotification('Carteirinha salva e PDF com foto gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      this.showNotification('Carteirinha salva com sucesso!');
    }
  }

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

  registerServiceWorker() {
    if ('serviceWorker' in navigator && navigator.serviceWorker) {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {});
    }
  }

  init() {
    this.storageManager = new StorageManager();
    this.cardManager = new CardManager();
    this.qrManager = new QRManager();

    this.formManager = new FormManager({
      onFieldChange: (field, value) => this.onFieldChange(field, value),
      onPhotoChange: (dataUrl) => this.onPhotoChange(dataUrl),
      onSave: () => this.onSave()
    });

    const savedData = this.storageManager.load();

    if (savedData) {
      this.studentData = { ...DEFAULT_STUDENT_DATA, ...savedData, isSaved: true };
    } else {
      // Primeira vez abrindo o site: QR Code genérico e não funcional
      this.studentData = { ...DEFAULT_STUDENT_DATA, isSaved: false };
    }

    if (!this.studentData.codigo || !this.formManager.validateCode(this.studentData.codigo)) {
      this.studentData.codigo = this.formManager.generateCode();
      if (savedData) {
        this.storageManager.save(this.studentData);
      }
    }

    if (savedData) {
      this.cardManager.updateCard(this.studentData);
      this.qrManager.generate(this.studentData);
      this.updateGreeting(this.studentData.nome);

      const linkUrl = this.studentData.pdfBlobUrl || this.qrManager.buildQRData(this.studentData);
      this.updateOnlinePDFLink(linkUrl);
    } else {
      this.updateGreeting('');
      this.cardManager.updateCard(this.studentData);
      // Na primeira visita sem salvar, gera QR Code genérico (não funcional)
      this.qrManager.generate({ ...this.studentData, isSaved: false });
    }

    this.pdfGenerator = new PDFGenerator();
    this.formManager.populateForm(this.studentData);
    this.formManager.bindForm();
    this.navigationManager = new NavigationManager();

    const menuBtn = document.getElementById('menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => this.toggleEditForm());
    }

    this.checkQRScanValidation();
    this.registerServiceWorker();
  }

  checkQRScanValidation() {
    if (typeof window === 'undefined' || !window.location) return;

    const pathname = window.location.pathname || '';
    const search = window.location.search || '';

    const pdfMatch = pathname.match(/\/pdf\/([a-zA-Z0-9]+)/i);
    const urlParams = new URLSearchParams(search);
    const scannedCode = pdfMatch ? pdfMatch[1].replace(/\.pdf$/i, '') : (urlParams.get('code') || urlParams.get('codigo') || urlParams.get('validar'));

    if (scannedCode) {
      const cleanCode = scannedCode.toLowerCase();
      let updated = false;

      if (!this.studentData.codigo || this.studentData.codigo.toLowerCase() !== cleanCode) {
        this.studentData.codigo = cleanCode;
        updated = true;
      }

      const scannedNome = urlParams.get('n') || urlParams.get('nome');
      if (scannedNome && scannedNome !== this.studentData.nome) {
        this.studentData.nome = scannedNome;
        updated = true;
      }

      const scannedCurso = urlParams.get('c') || urlParams.get('curso');
      if (scannedCurso && scannedCurso !== this.studentData.curso) {
        this.studentData.curso = scannedCurso;
        updated = true;
      }

      const scannedInst = urlParams.get('i') || urlParams.get('instituicao');
      if (scannedInst && scannedInst !== this.studentData.instituicao) {
        this.studentData.instituicao = scannedInst;
        updated = true;
      }

      const scannedCpf = urlParams.get('cpf');
      if (scannedCpf) {
        const formattedCpf = scannedCpf.length === 11 ? scannedCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : scannedCpf;
        if (formattedCpf !== this.studentData.cpf) {
          this.studentData.cpf = formattedCpf;
          updated = true;
        }
      }

      const scannedNasc = urlParams.get('d') || urlParams.get('nascimento');
      if (scannedNasc && scannedNasc !== this.studentData.nascimento) {
        this.studentData.nascimento = scannedNasc;
        updated = true;
      }

      const scannedFoto = urlParams.get('f') || urlParams.get('foto');
      if (scannedFoto && scannedFoto !== this.studentData.foto) {
        this.studentData.foto = scannedFoto;
        this.studentData.fotoThumb = scannedFoto;
        updated = true;
      }

      if (updated) {
        try {
          this.storageManager.save(this.studentData);
        } catch (e) {}
        this.cardManager.updateCard(this.studentData);
        this.qrManager.generate(this.studentData);
      }

      this.showPDFViewer(this.studentData);
    }
  }

  showPDFViewer(data) {
    const pdfSection = document.getElementById('section-pdf-viewer');
    if (!pdfSection) return;

    const student = data || this.studentData;

    const nome = student.nome || 'Emerson Vicosa de Lima';
    const curso = student.curso || 'Ciência da Computação';
    const inst = student.instituicao || 'UNIRITTER';
    const code = (student.codigo || '6382b41f').toLowerCase();
    const cpf = student.cpf || '039.894.040-16';
    const nasc = student.nascimento || '10/08/1998';

    const elNome = document.getElementById('pdf-doc-nome');
    if (elNome) elNome.textContent = nome;

    const elNomeMain = document.getElementById('pdf-doc-nome-main');
    if (elNomeMain) elNomeMain.textContent = nome;

    const elCurso = document.getElementById('pdf-doc-curso');
    if (elCurso) elCurso.textContent = curso;

    const elCursoVal = document.getElementById('pdf-doc-curso-val');
    if (elCursoVal) elCursoVal.textContent = curso.toUpperCase();

    const elInst = document.getElementById('pdf-doc-inst');
    if (elInst) elInst.textContent = inst;

    const elInstVal = document.getElementById('pdf-doc-inst-val');
    if (elInstVal) elInstVal.textContent = inst.toUpperCase();

    const elCode = document.getElementById('pdf-doc-code');
    if (elCode) elCode.textContent = code;

    const elCpf = document.getElementById('pdf-doc-cpf-val');
    if (elCpf) elCpf.textContent = cpf;

    const elNasc = document.getElementById('pdf-doc-nasc-val');
    if (elNasc) elNasc.textContent = nasc;

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const elStamp = document.getElementById('pdf-doc-date-stamp');
    if (elStamp) elStamp.textContent = `Brasília, ${formattedDate}`;

    const photoImg = document.getElementById('pdf-doc-photo');
    const photoPlaceholder = document.getElementById('pdf-doc-photo-placeholder');
    if (photoImg && photoPlaceholder) {
      if (student.foto) {
        photoImg.src = student.foto;
        photoImg.style.display = 'block';
        photoPlaceholder.style.display = 'none';
      } else {
        photoImg.style.display = 'none';
        photoPlaceholder.style.display = 'flex';
      }
    }

    const qrCanvas = document.getElementById('pdf-doc-qr-canvas');
    if (qrCanvas && window.QRCode) {
      const origin = (window.location && window.location.origin) ? window.location.origin : 'https://carteira-estudante-pwa.vercel.app';
      const qrData = `${origin}/pdf/${code}.pdf`;
      try {
        window.QRCode.toCanvas(qrCanvas, qrData, { margin: 1, width: 100 });
      } catch (e) {}
    }

    const mainSections = document.querySelectorAll('.main-content > .section');
    mainSections.forEach((sec) => {
      if (sec.id !== 'section-pdf-viewer') {
        sec.setAttribute('hidden', '');
        sec.style.display = 'none';
      }
    });

    pdfSection.removeAttribute('hidden');
    pdfSection.style.display = 'flex';

    const btnDownload = document.getElementById('btn-download-pdf-doc');
    if (btnDownload) {
      btnDownload.onclick = () => this.onSave();
    }

    const btnClose = document.getElementById('btn-close-pdf-doc');
    if (btnClose) {
      btnClose.onclick = () => {
        pdfSection.setAttribute('hidden', '');
        pdfSection.style.display = 'none';
        if (this.navigationManager) {
          this.navigationManager.activateTab(this.navigationManager.getActiveTab());
        }
      };
    }
  }
}

export { DEFAULT_STUDENT_DATA };

document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});
