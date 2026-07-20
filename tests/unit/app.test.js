/**
 * Testes unitários para o módulo app.js
 * Verifica inicialização, fluxo de boot e conexões entre managers.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { App, DEFAULT_STUDENT_DATA } from '../../js/app.js';

// Monta o DOM mínimo para testes
function setupDOM() {
  document.body.innerHTML = `
    <header>
      <h1 id="greeting">Olá, Estudante!</h1>
    </header>
    <main>
      <section id="section-inicio">
        <div id="card-flip">
          <div id="card-flip-inner">
            <div class="card--front">
              <img id="card-photo" src="" alt="">
              <div id="card-photo-placeholder"></div>
              <span id="card-nome" data-placeholder="Nome do estudante"></span>
              <span id="card-curso" data-placeholder="Curso do estudante"></span>
              <span id="card-nascimento" data-placeholder="DD/MM/AAAA"></span>
              <span id="card-cpf" data-placeholder="XXX.XXX.XXX-XX"></span>
              <span id="card-validade" data-placeholder="MM/AAAA"></span>
              <span id="card-seal-year">2026</span>
              <canvas id="qr-canvas" width="80" height="80"></canvas>
              <div id="qr-placeholder"></div>
            </div>
            <div class="card--back"></div>
          </div>
        </div>
      </section>
      <section id="section-indique" hidden></section>
      <section id="section-central" hidden></section>
      <section id="section-carteiras" hidden></section>
      <section id="section-avisos" hidden></section>
      <section id="edit-form-section" hidden>
        <form id="edit-form">
          <input id="input-nome" type="text">
          <span id="error-nome"></span>
          <input id="input-curso" type="text">
          <span id="error-curso"></span>
          <input id="input-nascimento" type="text">
          <span id="error-nascimento"></span>
          <input id="input-cpf" type="text">
          <span id="error-cpf"></span>
          <input id="input-validade" type="number">
          <span id="error-validade"></span>
          <input id="input-foto" type="file">
          <span id="error-foto"></span>
        </form>
      </section>
      <button id="menu-btn"></button>
      <nav id="bottom-nav">
        <button class="bottom-nav__tab bottom-nav__tab--active" data-tab="0"></button>
        <button class="bottom-nav__tab" data-tab="1"></button>
        <button class="bottom-nav__tab" data-tab="2"></button>
        <button class="bottom-nav__tab" data-tab="3"></button>
        <button class="bottom-nav__tab" data-tab="4"></button>
      </nav>
      <div id="notification" hidden>
        <p id="notification-message"></p>
      </div>
    </main>
  `;
}

describe('App Module', () => {
  let app;

  beforeEach(() => {
    setupDOM();
    localStorage.clear();
    app = new App();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('updateGreeting', () => {
    it('should display "Olá, [Nome]!" when name is provided', () => {
      app.updateGreeting('Maria');
      expect(document.getElementById('greeting').textContent).toBe('Olá, Maria!');
    });

    it('should display "Olá, Estudante!" when name is empty', () => {
      app.updateGreeting('');
      expect(document.getElementById('greeting').textContent).toBe('Olá, Estudante!');
    });

    it('should display "Olá, Estudante!" when name is only whitespace', () => {
      app.updateGreeting('   ');
      expect(document.getElementById('greeting').textContent).toBe('Olá, Estudante!');
    });

    it('should trim the name in greeting', () => {
      app.updateGreeting('  João  ');
      expect(document.getElementById('greeting').textContent).toBe('Olá, João!');
    });
  });

  describe('showNotification', () => {
    it('should show notification with message', () => {
      app.showNotification('Erro ao salvar');

      const notification = document.getElementById('notification');
      const message = document.getElementById('notification-message');

      expect(notification.hasAttribute('hidden')).toBe(false);
      expect(notification.classList.contains('notification--visible')).toBe(true);
      expect(message.textContent).toBe('Erro ao salvar');
    });

    it('should hide notification after 3 seconds', () => {
      vi.useFakeTimers();
      app.showNotification('Teste');

      const notification = document.getElementById('notification');
      expect(notification.classList.contains('notification--visible')).toBe(true);

      vi.advanceTimersByTime(3000);

      expect(notification.classList.contains('notification--visible')).toBe(false);
      expect(notification.hasAttribute('hidden')).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('toggleEditForm', () => {
    it('should show form when hidden', () => {
      const editSection = document.getElementById('edit-form-section');

      expect(editSection.hasAttribute('hidden')).toBe(true);
      app.toggleEditForm();
      expect(editSection.hasAttribute('hidden')).toBe(false);
    });

    it('should hide form when visible', () => {
      const editSection = document.getElementById('edit-form-section');

      editSection.removeAttribute('hidden');
      app.toggleEditForm();
      expect(editSection.hasAttribute('hidden')).toBe(true);
    });
  });

  describe('Menu button', () => {
    it('should toggle edit form on click', () => {
      app.init();

      const menuBtn = document.getElementById('menu-btn');
      const editSection = document.getElementById('edit-form-section');

      expect(editSection.hasAttribute('hidden')).toBe(true);
      menuBtn.click();
      expect(editSection.hasAttribute('hidden')).toBe(false);
      menuBtn.click();
      expect(editSection.hasAttribute('hidden')).toBe(true);
    });
  });

  describe('Boot flow', () => {
    it('should show default greeting when no data saved', () => {
      app.init();
      expect(document.getElementById('greeting').textContent).toBe('Olá, Estudante!');
    });

    it('should restore greeting from saved data', () => {
      localStorage.setItem('cie_student_data', JSON.stringify({
        nome: 'Carlos',
        curso: 'Engenharia',
        nascimento: '10/05/1999',
        cpf: '12345678901',
        validade: 2026,
        foto: null
      }));

      app.init();

      expect(document.getElementById('greeting').textContent).toBe('Olá, Carlos!');
    });

    it('should update card fields from saved data', () => {
      localStorage.setItem('cie_student_data', JSON.stringify({
        nome: 'Ana Silva',
        curso: 'Medicina',
        nascimento: '01/01/2000',
        cpf: '98765432100',
        validade: 2027,
        foto: null
      }));

      app.init();

      expect(document.getElementById('card-nome').textContent).toBe('Ana Silva');
      expect(document.getElementById('card-curso').textContent).toBe('Medicina');
      expect(document.getElementById('card-nascimento').textContent).toBe('01/01/2000');
      expect(document.getElementById('card-cpf').textContent).toBe('987.654.321-00');
      expect(document.getElementById('card-validade').textContent).toBe('31/03/2027');
    });
  });

  describe('onFieldChange', () => {
    it('should save data to localStorage on field change', () => {
      app.init();

      app.onFieldChange('nome', 'Pedro');

      const saved = JSON.parse(localStorage.getItem('cie_student_data'));
      expect(saved.nome).toBe('Pedro');
    });

    it('should update card when field changes', () => {
      app.init();

      app.onFieldChange('nome', 'Lucia');
      expect(document.getElementById('card-nome').textContent).toBe('Lucia');
    });

    it('should update greeting when name changes', () => {
      app.init();

      app.onFieldChange('nome', 'Roberto');
      expect(document.getElementById('greeting').textContent).toBe('Olá, Roberto!');
    });

    it('should not update greeting when non-name field changes', () => {
      app.init();
      app.onFieldChange('nome', 'Maria');
      expect(document.getElementById('greeting').textContent).toBe('Olá, Maria!');

      app.onFieldChange('curso', 'Medicina');
      expect(document.getElementById('greeting').textContent).toBe('Olá, Maria!');
    });

    it('should show notification when storage fails', () => {
      app.init();

      // Simulate storage error by mocking the storageManager.save method
      vi.spyOn(app.storageManager, 'save').mockImplementation(() => {
        const error = new Error('Armazenamento cheio. Não foi possível salvar os dados.');
        error.name = 'StorageError';
        throw error;
      });

      app.onFieldChange('nome', 'Teste');

      const notification = document.getElementById('notification');
      expect(notification.hasAttribute('hidden')).toBe(false);
      expect(document.getElementById('notification-message').textContent)
        .toBe('Armazenamento cheio. Não foi possível salvar os dados.');
    });
  });

  describe('onPhotoChange', () => {
    it('should save photo to localStorage', () => {
      app.init();

      app.onPhotoChange('data:image/png;base64,abc123');

      const saved = JSON.parse(localStorage.getItem('cie_student_data'));
      expect(saved.foto).toBe('data:image/png;base64,abc123');
    });

    it('should update card photo', () => {
      app.init();

      app.onPhotoChange('data:image/jpeg;base64,xyz');

      const photo = document.getElementById('card-photo');
      expect(photo.src).toContain('data:image/jpeg;base64,xyz');
    });
  });

  describe('Service Worker registration', () => {
    it('should attempt to register service worker if available', () => {
      const registerMock = vi.fn().mockResolvedValue({});
      Object.defineProperty(navigator, 'serviceWorker', {
        value: { register: registerMock },
        writable: true,
        configurable: true
      });

      app.registerServiceWorker();

      expect(registerMock).toHaveBeenCalledWith('./service-worker.js');
    });

    it('should not throw when navigator.serviceWorker is not supported', () => {
      // In happy-dom, delete the property to simulate absence
      const desc = Object.getOwnPropertyDescriptor(navigator, 'serviceWorker');
      delete navigator.serviceWorker;
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        writable: true,
        configurable: true
      });

      expect(() => app.registerServiceWorker()).not.toThrow();

      // Restore
      if (desc) {
        Object.defineProperty(navigator, 'serviceWorker', desc);
      }
    });
  });

  describe('DEFAULT_STUDENT_DATA', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_STUDENT_DATA.nome).toBe('');
      expect(DEFAULT_STUDENT_DATA.curso).toBe('');
      expect(DEFAULT_STUDENT_DATA.nascimento).toBe('');
      expect(DEFAULT_STUDENT_DATA.cpf).toBe('');
      expect(DEFAULT_STUDENT_DATA.validade).toBe(new Date().getFullYear() + 1);
      expect(DEFAULT_STUDENT_DATA.foto).toBe(null);
    });
  });
});
