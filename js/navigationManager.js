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
    'section-central',
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
    if (typeof tabIndex !== 'number' || tabIndex < 0 || tabIndex > 4) {
      return;
    }

    this.#activeTab = tabIndex;

    // Atualiza estado visual das abas (DOM)
    this.#updateTabStyles(tabIndex);

    // Atualiza visibilidade das seções
    this.#updateSections(tabIndex);
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
        } else {
          section.setAttribute('hidden', '');
        }
      }
    });

    // Esconder o formulário de edição ao trocar de aba
    const editSection = document.getElementById('edit-form-section');
    if (editSection) {
      editSection.setAttribute('hidden', '');
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
