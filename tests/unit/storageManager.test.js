import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageManager } from '../../js/storageManager.js';

describe('StorageManager', () => {
  let storage;

  beforeEach(() => {
    storage = new StorageManager();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('STORAGE_KEY', () => {
    it('deve ter a chave estática correta', () => {
      expect(StorageManager.STORAGE_KEY).toBe('cie_student_data');
    });
  });

  describe('isAvailable()', () => {
    it('deve retornar true quando localStorage está disponível', () => {
      expect(storage.isAvailable()).toBe(true);
    });

    it('deve retornar false quando localStorage lança exceção', () => {
      const originalLS = window.localStorage;
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: () => { throw new Error('Sem acesso'); },
          removeItem: () => {},
          getItem: () => null,
          clear: () => {},
        },
        writable: true,
        configurable: true,
      });
      expect(storage.isAvailable()).toBe(false);
      Object.defineProperty(window, 'localStorage', {
        value: originalLS,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('save(data)', () => {
    const sampleData = {
      nome: 'Maria Silva Santos',
      curso: 'GRADUAÇÃO - CIÊNCIA DA COMPUTAÇÃO',
      nascimento: '15/03/2000',
      cpf: '12345678901',
      validade: 2026,
      foto: null
    };

    it('deve salvar dados corretamente e retornar true', () => {
      const result = storage.save(sampleData);
      expect(result).toBe(true);
      const stored = localStorage.getItem(StorageManager.STORAGE_KEY);
      expect(JSON.parse(stored)).toEqual(sampleData);
    });

    it('deve sobrescrever dados existentes', () => {
      storage.save(sampleData);
      const newData = { ...sampleData, nome: 'João Oliveira' };
      storage.save(newData);
      const stored = JSON.parse(localStorage.getItem(StorageManager.STORAGE_KEY));
      expect(stored.nome).toBe('João Oliveira');
    });

    it('deve lançar StorageError se localStorage indisponível', () => {
      vi.spyOn(storage, 'isAvailable').mockReturnValue(false);

      expect(() => storage.save(sampleData)).toThrow();
      try {
        storage.save(sampleData);
      } catch (e) {
        expect(e.name).toBe('StorageError');
      }

      vi.restoreAllMocks();
    });

    it('deve lançar StorageError com mensagem apropriada para QuotaExceededError', () => {
      const originalSetItem = Storage.prototype.setItem;
      // Simula isAvailable passando, mas setItem falhando no save real
      let callCount = 0;
      Storage.prototype.setItem = function (key) {
        callCount++;
        // Permite o teste de isAvailable (chave __storage_test__)
        if (key === '__storage_test__') return;
        const err = new DOMException('Quota exceeded', 'QuotaExceededError');
        err.name = 'QuotaExceededError';
        throw err;
      };

      try {
        storage.save(sampleData);
      } catch (e) {
        expect(e.name).toBe('StorageError');
        expect(e.message).toContain('cheio');
      }

      Storage.prototype.setItem = originalSetItem;
    });

    it('deve salvar dados com foto (data URL)', () => {
      const dataWithPhoto = { ...sampleData, foto: 'data:image/png;base64,iVBORw0KGgo=' };
      const result = storage.save(dataWithPhoto);
      expect(result).toBe(true);
      const stored = JSON.parse(localStorage.getItem(StorageManager.STORAGE_KEY));
      expect(stored.foto).toBe('data:image/png;base64,iVBORw0KGgo=');
    });
  });

  describe('load()', () => {
    it('deve retornar null se nenhum dado estiver salvo', () => {
      expect(storage.load()).toBeNull();
    });

    it('deve recuperar dados salvos corretamente', () => {
      const data = {
        nome: 'Ana Costa',
        curso: 'Engenharia Civil',
        nascimento: '01/01/1999',
        cpf: '98765432100',
        validade: 2025,
        foto: null
      };
      localStorage.setItem(StorageManager.STORAGE_KEY, JSON.stringify(data));
      expect(storage.load()).toEqual(data);
    });

    it('deve retornar null se os dados estiverem corrompidos (JSON inválido)', () => {
      localStorage.setItem(StorageManager.STORAGE_KEY, '{invalid json');
      expect(storage.load()).toBeNull();
    });
  });
});
