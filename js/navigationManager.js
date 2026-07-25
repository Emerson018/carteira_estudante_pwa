/**
 * NavigationManager — Controla a navegação entre abas da barra inferior.
 * @module navigationManager
 */

export class NavigationManager {
  /** @type {number} Índice da aba atualmente ativa (0-4) */
  #activeTab = 0;

  /** @type {string[]} IDs das seções correspondentes a cada aba */
  #sectionIds = [
    'section-inicio',
    'section-indique',
    'section-carteiras',
    'section-avisos'
  ];

  /**
   * Inicializa o NavigationManager.
   * Configura a aba 0 como ativa e registra event listeners nos botões.
   */
  constructor() {
    this.#activeTab = 0;
    this.#bindEvents();
    this.activateTab(0);
  }

  /**
   * Ativa uma aba e desativa as demais.
   * Atualiza classes CSS, atributos aria e visibilidade das seções.
   * @param {number} tabIndex - Índice da aba (0-4)
   */
  activateTab(tabIndex) {
    if (typeof tabIndex !== 'number' || tabIndex < 0 || tabIndex >= this.#sectionIds.length) {
      return;
    }

    this.#activeTab = tabIndex;

    // Atualiza estado visual das abas (DOM)
    this.#updateTabStyles(tabIndex);

    // Atualiza visibilidade das seções
    this.#updateSections(tabIndex);

    // Atualiza o cabeçalho superior
    this.#updateHeader(tabIndex);
  }

  /**
   * Atualiza os títulos do cabeçalho superior de acordo com a aba ativa.
   * @param {number} activeIndex
   */
  #updateHeader(activeIndex) {
    const greeting = document.getElementById('greeting');
    const subtitle = document.getElementById('header-subtitle');
    if (!greeting || !subtitle) return;

    if (activeIndex === 2) {
      greeting.textContent = 'Minhas Carteiras';
      subtitle.textContent = 'Histórico de carteiras estudantis';
    } else if (activeIndex === 0) {
      const cardNomeEl = document.getElementById('card-nome');
      const studentName = cardNomeEl && cardNomeEl.textContent ? cardNomeEl.textContent.trim() : '';
      greeting.textContent = studentName ? `Olá, ${studentName.split(' ')[0]}!` : 'Olá, Estudante!';
      subtitle.textContent = 'Sua carteira estudantil';
    } else if (activeIndex === 1) {
      greeting.textContent = 'Indique e Ganhe';
      subtitle.textContent = 'Compartilhe com seus amigos';
    } else if (activeIndex === 3) {
      greeting.textContent = 'Avisos';
      subtitle.textContent = 'Central de notificações';
    }
  }

  /**
   * Retorna o índice da aba atualmente ativa.
   * @returns {number} Índice da aba ativa (0-4)
   */
  getActiveTab() {
    return this.#activeTab;
  }

  /**
   * Atualiza classes e atributos aria das abas.
   * @param {number} activeIndex - Índice da aba a ser ativada
   */
  #updateTabStyles(activeIndex) {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;

    const tabs = nav.querySelectorAll('.nav-item');

    tabs.forEach((tab, index) => {
      if (index === activeIndex) {
        tab.classList.add('active');
        tab.setAttribute('aria-current', 'page');
      } else {
        tab.classList.remove('active');
        tab.removeAttribute('aria-current');
      }
    });
  }

  /**
   * Atualiza visibilidade das seções de conteúdo.
   * Esconde todas as seções e mostra apenas a correspondente à aba ativa.
   * Também esconde o formulário de edição ao trocar de aba.
   * @param {number} activeIndex - Índice da aba ativa
   */
  #updateSections(activeIndex) {
    // Esconder todas as seções de conteúdo
    this.#sectionIds.forEach((sectionId, index) => {
      const section = document.getElementById(sectionId);
      if (section) {
        if (index === activeIndex) {
          section.removeAttribute('hidden');
          section.style.display = 'flex';
        } else {
          section.setAttribute('hidden', '');
          section.style.display = 'none';
        }
      }
    });

    // Esconder o formulário de edição ao trocar de aba
    const editSection = document.getElementById('edit-form-section');
    if (editSection) {
      editSection.setAttribute('hidden', '');
      editSection.style.display = 'none';
    }
  }

  /**
   * Registra event listeners de click nos botões de navegação.
   */
  #bindEvents() {
    const nav = document.getElementById('bottom-nav');
    if (!nav) return;

    const tabs = nav.querySelectorAll('.nav-item');

    tabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const tabIndex = parseInt(tab.getAttribute('data-tab'), 10);
        if (!isNaN(tabIndex)) {
          this.activateTab(tabIndex);
        }
      });
    });
  }
}
