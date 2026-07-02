import { describe, it, expect, beforeEach } from 'vitest';
import { NavigationManager } from '../../js/navigationManager.js';

/**
 * Monta o DOM mínimo necessário para testar o NavigationManager.
 */
function setupDOM() {
  document.body.innerHTML = `
    <section id="section-inicio"></section>
    <section id="section-indique" hidden></section>
    <section id="section-central" hidden></section>
    <section id="section-carteiras" hidden></section>
    <section id="section-avisos" hidden></section>
    <section id="edit-form-section" hidden></section>

    <nav class="bottom-nav" id="bottom-nav">
      <button class="bottom-nav__tab bottom-nav__tab--active" data-tab="0" data-section="section-inicio" aria-current="page" type="button">
        <span class="bottom-nav__label">Início</span>
      </button>
      <button class="bottom-nav__tab" data-tab="1" data-section="section-indique" type="button">
        <span class="bottom-nav__label">Indique</span>
      </button>
      <button class="bottom-nav__tab" data-tab="2" data-section="section-central" type="button">
        <span class="bottom-nav__label">Central</span>
      </button>
      <button class="bottom-nav__tab" data-tab="3" data-section="section-carteiras" type="button">
        <span class="bottom-nav__label">Carteiras</span>
      </button>
      <button class="bottom-nav__tab" data-tab="4" data-section="section-avisos" type="button">
        <span class="bottom-nav__label">Avisos</span>
      </button>
    </nav>
  `;
}

describe('NavigationManager', () => {
  let navManager;

  beforeEach(() => {
    setupDOM();
    navManager = new NavigationManager();
  });

  describe('Estado inicial', () => {
    it('deve iniciar com aba 0 (Início) ativa', () => {
      expect(navManager.getActiveTab()).toBe(0);
    });

    it('deve ter a classe active na primeira aba ao iniciar', () => {
      const tabs = document.querySelectorAll('.bottom-nav__tab');
      expect(tabs[0].classList.contains('bottom-nav__tab--active')).toBe(true);
    });

    it('deve ter aria-current="page" na primeira aba ao iniciar', () => {
      const tabs = document.querySelectorAll('.bottom-nav__tab');
      expect(tabs[0].getAttribute('aria-current')).toBe('page');
    });

    it('deve exibir a seção inicio e esconder as demais', () => {
      expect(document.getElementById('section-inicio').hasAttribute('hidden')).toBe(false);
      expect(document.getElementById('section-indique').hasAttribute('hidden')).toBe(true);
      expect(document.getElementById('section-central').hasAttribute('hidden')).toBe(true);
      expect(document.getElementById('section-carteiras').hasAttribute('hidden')).toBe(true);
      expect(document.getElementById('section-avisos').hasAttribute('hidden')).toBe(true);
    });
  });

  describe('activateTab', () => {
    it('deve ativar a aba no índice fornecido', () => {
      navManager.activateTab(2);
      expect(navManager.getActiveTab()).toBe(2);
    });

    it('deve remover classe active das demais abas', () => {
      navManager.activateTab(3);
      const tabs = document.querySelectorAll('.bottom-nav__tab');
      tabs.forEach((tab, index) => {
        if (index === 3) {
          expect(tab.classList.contains('bottom-nav__tab--active')).toBe(true);
        } else {
          expect(tab.classList.contains('bottom-nav__tab--active')).toBe(false);
        }
      });
    });

    it('deve mover aria-current="page" para a aba ativa', () => {
      navManager.activateTab(4);
      const tabs = document.querySelectorAll('.bottom-nav__tab');
      tabs.forEach((tab, index) => {
        if (index === 4) {
          expect(tab.getAttribute('aria-current')).toBe('page');
        } else {
          expect(tab.hasAttribute('aria-current')).toBe(false);
        }
      });
    });

    it('deve mostrar a seção correspondente e esconder as demais', () => {
      navManager.activateTab(1);
      expect(document.getElementById('section-inicio').hasAttribute('hidden')).toBe(true);
      expect(document.getElementById('section-indique').hasAttribute('hidden')).toBe(false);
      expect(document.getElementById('section-central').hasAttribute('hidden')).toBe(true);
      expect(document.getElementById('section-carteiras').hasAttribute('hidden')).toBe(true);
      expect(document.getElementById('section-avisos').hasAttribute('hidden')).toBe(true);
    });

    it('deve esconder edit-form-section ao trocar de aba', () => {
      // Simular que o formulário está visível
      document.getElementById('edit-form-section').removeAttribute('hidden');
      navManager.activateTab(2);
      expect(document.getElementById('edit-form-section').hasAttribute('hidden')).toBe(true);
    });

    it('deve ignorar índices inválidos (negativos)', () => {
      navManager.activateTab(2);
      navManager.activateTab(-1);
      expect(navManager.getActiveTab()).toBe(2);
    });

    it('deve ignorar índices inválidos (maiores que 4)', () => {
      navManager.activateTab(1);
      navManager.activateTab(5);
      expect(navManager.getActiveTab()).toBe(1);
    });

    it('deve ignorar valores não numéricos', () => {
      navManager.activateTab(1);
      navManager.activateTab('abc');
      expect(navManager.getActiveTab()).toBe(1);
    });

    it('deve ignorar null e undefined', () => {
      navManager.activateTab(3);
      navManager.activateTab(null);
      expect(navManager.getActiveTab()).toBe(3);
      navManager.activateTab(undefined);
      expect(navManager.getActiveTab()).toBe(3);
    });
  });

  describe('getActiveTab', () => {
    it('deve retornar um número', () => {
      expect(typeof navManager.getActiveTab()).toBe('number');
    });

    it('deve refletir a última aba ativada', () => {
      navManager.activateTab(4);
      expect(navManager.getActiveTab()).toBe(4);
      navManager.activateTab(0);
      expect(navManager.getActiveTab()).toBe(0);
    });
  });

  describe('Eventos de click', () => {
    it('deve ativar aba ao clicar no botão correspondente', () => {
      const tabs = document.querySelectorAll('.bottom-nav__tab');
      tabs[3].click();
      expect(navManager.getActiveTab()).toBe(3);
      expect(tabs[3].classList.contains('bottom-nav__tab--active')).toBe(true);
    });

    it('deve desativar aba anterior ao clicar em outra', () => {
      const tabs = document.querySelectorAll('.bottom-nav__tab');
      tabs[2].click();
      expect(tabs[0].classList.contains('bottom-nav__tab--active')).toBe(false);
      expect(tabs[2].classList.contains('bottom-nav__tab--active')).toBe(true);
    });

    it('deve trocar a seção visível ao clicar', () => {
      const tabs = document.querySelectorAll('.bottom-nav__tab');
      tabs[4].click();
      expect(document.getElementById('section-avisos').hasAttribute('hidden')).toBe(false);
      expect(document.getElementById('section-inicio').hasAttribute('hidden')).toBe(true);
    });
  });
});
