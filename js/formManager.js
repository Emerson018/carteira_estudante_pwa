/**
 * FormManager — Gerencia entrada de dados, validação e binding de formulário.
 * @module formManager
 */

export class FormManager {
  /**
   * Tamanho máximo de foto em bytes (5 MB).
   */
  static MAX_PHOTO_SIZE = 5 * 1024 * 1024;

  /**
   * Formatos de imagem aceitos.
   */
  static ACCEPTED_FORMATS = ['image/jpeg', 'image/png'];

  /**
   * Mensagens de erro padrão.
   */
  static ERRORS = {
    nome: 'Nome é obrigatório.',
    curso: 'Curso é obrigatório.',
    instituicao: 'Instituição é obrigatória.',
    nascimento: 'Data inválida. Use o formato DD/MM/AAAA.',
    cpf: 'CPF deve conter exatamente 11 dígitos numéricos.',
    validade: `Ano de validade deve estar entre ${new Date().getFullYear()} e ${new Date().getFullYear() + 10}.`,
    fotoFormat: 'Formato não suportado. Use JPEG ou PNG.',
    fotoSize: 'A foto deve ter no máximo 5 MB.'
  };

  /**
   * @param {object} options
   * @param {function} [options.onFieldChange] - Callback chamado quando um campo válido é alterado: (fieldName, value) => void
   * @param {function} [options.onPhotoChange] - Callback chamado quando uma foto válida é processada: (dataUrl) => void
   */
  constructor({ onFieldChange, onPhotoChange, onSave } = {}) {
    this.onFieldChange = onFieldChange || null;
    this.onPhotoChange = onPhotoChange || null;
    this.onSave = onSave || null;
    this._lastValidValues = {};
    this._bound = false;
  }

  /**
   * Valida formato de CPF (exatamente 11 dígitos numéricos).
   * @param {string} cpf - String a validar
   * @returns {boolean}
   */
  validateCPF(cpf) {
    if (typeof cpf !== 'string') return false;
    return /^\d{11}$/.test(cpf);
  }

  /**
   * Valida formato de data DD/MM/AAAA.
   * Dia: 01-31, Mês: 01-12, Ano: 1900-2100.
   * @param {string} date - String a validar
   * @returns {boolean}
   */
  validateDate(date) {
    if (typeof date !== 'string') return false;
    const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return false;

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (day < 1 || day > 31) return false;
    if (month < 1 || month > 12) return false;
    if (year < 1900 || year > 2100) return false;

    return true;
  }

  /**
   * Valida ano de validade (entre ano atual e ano atual + 10).
   * @param {number|string} year - Ano a validar
   * @returns {boolean}
   */
  validateYear(year) {
    const parsed = typeof year === 'string' ? parseInt(year, 10) : year;
    if (!Number.isFinite(parsed)) return false;

    const currentYear = new Date().getFullYear();
    return parsed >= currentYear && parsed <= currentYear + 10;
  }

  /**
   * Valida todos os campos do formulário.
   * @param {object} data - Dados parciais do estudante a validar
   * @returns {{ isValid: boolean, errors: Object.<string, string> }}
   */
  validate(data) {
    const errors = {};

    // Nome: obrigatório, max 80 chars
    if (!data.nome || typeof data.nome !== 'string' || data.nome.trim().length === 0) {
      errors.nome = FormManager.ERRORS.nome;
    }

    // Curso: obrigatório, max 100 chars
    if (!data.curso || typeof data.curso !== 'string' || data.curso.trim().length === 0) {
      errors.curso = FormManager.ERRORS.curso;
    }

    // Instituição: obrigatório, max 100 chars
    if (!data.instituicao || typeof data.instituicao !== 'string' || data.instituicao.trim().length === 0) {
      errors.instituicao = FormManager.ERRORS.instituicao;
    }

    // Data de nascimento: formato DD/MM/AAAA
    if (data.nascimento !== undefined && data.nascimento !== '') {
      if (!this.validateDate(data.nascimento)) {
        errors.nascimento = FormManager.ERRORS.nascimento;
      }
    }

    // CPF: exatamente 11 dígitos
    if (data.cpf !== undefined && data.cpf !== '') {
      if (!this.validateCPF(data.cpf)) {
        errors.cpf = FormManager.ERRORS.cpf;
      }
    }

    // Validade: ano entre atual e atual+10
    if (data.validade !== undefined && data.validade !== '') {
      if (!this.validateYear(data.validade)) {
        errors.validade = FormManager.ERRORS.validade;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Processa upload de foto: verifica formato e tamanho.
   * @param {File} file - Arquivo selecionado
   * @returns {Promise<string>} Data URL da imagem
   */
  processPhoto(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error(FormManager.ERRORS.fotoFormat));
        return;
      }

      // Verifica formato
      if (!FormManager.ACCEPTED_FORMATS.includes(file.type)) {
        reject(new Error(FormManager.ERRORS.fotoFormat));
        return;
      }

      // Verifica tamanho
      if (file.size > FormManager.MAX_PHOTO_SIZE) {
        reject(new Error(FormManager.ERRORS.fotoSize));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Preenche os campos do formulário com os dados fornecidos.
   * @param {object} data - Dados do estudante
   */
  populateForm(data) {
    if (!data) return;
    const textFields = ['nome', 'curso', 'instituicao', 'nascimento', 'cpf', 'codigo'];
    textFields.forEach((field) => {
      const input = document.getElementById(`input-${field}`);
      if (input) {
        input.value = data[field] || '';
      }
    });

    const validadeInput = document.getElementById('input-validade');
    if (validadeInput) {
      validadeInput.value = data.validade || '';
    }
  }

  /**
   * Faz o binding dos campos do formulário com eventos de input/change.
   * Gerencia estado de erros visualmente.
   */
  bindForm() {
    if (this._bound) return;

    const form = document.getElementById('edit-form');
    if (!form) return;

    this._form = form;
    this._bound = true;

    // Campos de texto
    const textFields = ['nome', 'curso', 'instituicao', 'nascimento', 'cpf', 'codigo'];
    textFields.forEach((field) => {
      const input = document.getElementById(`input-${field}`);
      if (!input) return;

      input.addEventListener('input', () => {
        this._handleFieldChange(field, input.value, input);
      });
    });

    // Campo numérico (validade)
    const validadeInput = document.getElementById('input-validade');
    if (validadeInput) {
      validadeInput.addEventListener('input', () => {
        const value = validadeInput.value ? parseInt(validadeInput.value, 10) : '';
        this._handleFieldChange('validade', value, validadeInput);
      });
    }

    // Campo de foto
    const fotoInput = document.getElementById('input-foto');
    if (fotoInput) {
      fotoInput.addEventListener('change', () => {
        const file = fotoInput.files[0];
        if (!file) return;

        this.processPhoto(file)
          .then((dataUrl) => {
            this._clearError('foto', fotoInput);
            if (this.onPhotoChange) {
              this.onPhotoChange(dataUrl);
            }
          })
          .catch((error) => {
            this._showError('foto', error.message, fotoInput);
          });
      });
    }

    // Evento de submit do formulário (botão Salvar)
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.onSave) {
        this.onSave();
      }
    });
  }

  /**
   * Trata mudança em um campo de texto/numérico.
   * @param {string} field - Nome do campo
   * @param {string|number} value - Valor atual
   * @param {HTMLElement} inputElement - Elemento input
   * @private
   */
  _handleFieldChange(field, value, inputElement) {
    let isValid = true;

    switch (field) {
      case 'nome':
        isValid = typeof value === 'string' && value.trim().length > 0;
        break;
      case 'curso':
        isValid = typeof value === 'string' && value.trim().length > 0;
        break;
      case 'instituicao':
        isValid = typeof value === 'string' && value.trim().length > 0;
        break;
      case 'codigo':
        // Campo opcional — qualquer valor é aceito
        isValid = true;
        break;
      case 'nascimento':
        // Permite campo vazio durante digitação; valida se tiver 10 chars
        if (value.length === 10) {
          isValid = this.validateDate(value);
        } else if (value.length > 0) {
          // Em digitação, não reporta erro ainda
          return;
        }
        break;
      case 'cpf':
        // Permite campo vazio durante digitação; valida se tiver 11 chars
        if (value.length === 11) {
          isValid = this.validateCPF(value);
        } else if (value.length > 0) {
          // Em digitação, não reporta erro ainda
          return;
        }
        break;
      case 'validade':
        if (value === '' || value === undefined) {
          isValid = false;
        } else {
          isValid = this.validateYear(value);
        }
        break;
    }

    if (isValid) {
      this._clearError(field, inputElement);
      this._lastValidValues[field] = value;
      if (this.onFieldChange) {
        this.onFieldChange(field, value);
      }
    } else {
      this._showError(field, FormManager.ERRORS[field] || 'Valor inválido.', inputElement);
    }
  }

  /**
   * Exibe erro visualmente no campo.
   * @param {string} field - Nome do campo
   * @param {string} message - Mensagem de erro
   * @param {HTMLElement} inputElement - Elemento input
   * @private
   */
  _showError(field, message, inputElement) {
    if (inputElement) {
      inputElement.classList.add('edit-form__input--error');
    }
    const errorSpan = document.getElementById(`error-${field}`);
    if (errorSpan) {
      errorSpan.textContent = message;
    }
  }

  /**
   * Remove erro visual do campo.
   * @param {string} field - Nome do campo
   * @param {HTMLElement} inputElement - Elemento input
   * @private
   */
  _clearError(field, inputElement) {
    if (inputElement) {
      inputElement.classList.remove('edit-form__input--error');
    }
    const errorSpan = document.getElementById(`error-${field}`);
    if (errorSpan) {
      errorSpan.textContent = '';
    }
  }

  /**
   * Retorna o último valor válido de um campo.
   * @param {string} field - Nome do campo
   * @returns {*} Último valor válido ou undefined
   */
  getLastValidValue(field) {
    return this._lastValidValues[field];
  }
}
