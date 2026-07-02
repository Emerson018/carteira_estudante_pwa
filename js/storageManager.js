/**
 * StorageManager — Gerencia persistência de dados do estudante no localStorage.
 * @module storageManager
 */

export class StorageManager {
  static STORAGE_KEY = 'cie_student_data';

  /**
   * Verifica disponibilidade do localStorage.
   * @returns {boolean} true se localStorage está disponível e funcional
   */
  isAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Salva dados do estudante no localStorage.
   * @param {object} data - Objeto StudentData com dados do estudante
   * @returns {boolean} true se salvo com sucesso
   * @throws {Error} StorageError se localStorage indisponível ou cheio (QuotaExceededError)
   */
  save(data) {
    if (!this.isAvailable()) {
      const error = new Error('localStorage não está disponível.');
      error.name = 'StorageError';
      throw error;
    }

    try {
      const json = JSON.stringify(data);
      localStorage.setItem(StorageManager.STORAGE_KEY, json);
      return true;
    } catch (error) {
      if (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014) {
        const storageError = new Error('Armazenamento cheio. Não foi possível salvar os dados.');
        storageError.name = 'StorageError';
        throw storageError;
      }
      const storageError = new Error('Erro ao salvar dados no localStorage.');
      storageError.name = 'StorageError';
      throw storageError;
    }
  }

  /**
   * Recupera dados do estudante do localStorage.
   * @returns {object|null} Dados salvos (StudentData) ou null se inexistentes
   */
  load() {
    try {
      const json = localStorage.getItem(StorageManager.STORAGE_KEY);
      if (json === null) {
        return null;
      }
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
