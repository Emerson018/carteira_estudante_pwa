/**
 * CardManager — Controla a exibição e animação do cartão estudantil.
 * Responsável por atualizar campos visuais, animação de flip e formatação de dados.
 */
export class CardManager {
  constructor() {
    this._animating = false;
    this._flipped = false;

    // DOM elements (will be null in test environments without DOM)
    this._flipInner = document.querySelector('#card-flip-inner');
    this._flipCard = document.querySelector('#card-flip');
    this._photo = document.querySelector('#card-photo');
    this._photoPlaceholder = document.querySelector('#card-photo-placeholder');
    this._nomeEl = document.querySelector('#card-nome');
    this._cursoEl = document.querySelector('#card-curso');
    this._nascimentoEl = document.querySelector('#card-nascimento');
    this._cpfEl = document.querySelector('#card-cpf');
    this._validadeEl = document.querySelector('#card-validade');
    this._sealYearEl = document.querySelector('#card-seal-year');

    this._bindEvents();
  }

  /**
   * Binds click and keyboard events on the card for flip interaction.
   */
  _bindEvents() {
    if (!this._flipCard) return;

    this._flipCard.addEventListener('click', () => {
      this.flip();
    });

    this._flipCard.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.flip();
      }
    });
  }

  /**
   * Updates visual fields on the card with provided student data.
   * @param {object} data - StudentData object
   */
  updateCard(data) {
    if (!data) return;

    // Photo
    this._updatePhoto(data.foto);

    // Text fields with formatting and placeholder handling
    this._setField(this._nomeEl, data.nome ? this.truncateText(data.nome, 60) : '');
    this._setField(this._cursoEl, data.curso ? this.truncateText(data.curso, 80) : '');
    this._setField(this._nascimentoEl, data.nascimento ? this.formatDate(data.nascimento) : '');
    this._setField(this._cpfEl, data.cpf ? this.formatCPF(data.cpf) : '');
    this._setField(this._validadeEl, data.validade ? this.formatValidity(data.validade) : '');

    // Year seal
    if (this._sealYearEl && data.validade) {
      this._sealYearEl.textContent = String(data.validade);
    }
  }

  /**
   * Updates photo display: shows image or placeholder.
   * @param {string|null} fotoDataUrl
   */
  _updatePhoto(fotoDataUrl) {
    if (!this._photo || !this._photoPlaceholder) return;

    if (fotoDataUrl) {
      this._photo.src = fotoDataUrl;
      this._photo.style.display = '';
      this._photoPlaceholder.style.display = 'none';
    } else {
      this._photo.src = '';
      this._photo.style.display = 'none';
      this._photoPlaceholder.style.display = '';
    }
  }

  /**
   * Sets a field's text content, showing placeholder if value is empty.
   * @param {HTMLElement|null} element
   * @param {string} value
   */
  _setField(element, value) {
    if (!element) return;

    if (value) {
      element.textContent = value;
      element.classList.remove('card__field-value--placeholder');
    } else {
      const placeholder = element.getAttribute('data-placeholder') || '';
      element.textContent = placeholder;
      element.classList.add('card__field-value--placeholder');
    }
  }

  /**
   * Executes flip animation (front→back or back→front).
   * Ignores calls while animation is in progress.
   */
  flip() {
    if (this._animating) return;

    this._animating = true;
    this._flipped = !this._flipped;

    if (this._flipInner) {
      if (this._flipped) {
        this._flipInner.classList.add('is-flipped');
      } else {
        this._flipInner.classList.remove('is-flipped');
      }
    }

    // Match CSS transition duration (0.6s = 600ms)
    setTimeout(() => {
      this._animating = false;
    }, 600);
  }

  /**
   * Returns whether the flip animation is currently running.
   * @returns {boolean}
   */
  isAnimating() {
    return this._animating;
  }

  /**
   * Formats a CPF string (11 digits) to XXX.XXX.XXX-XX.
   * @param {string} cpf - 11 numeric digits
   * @returns {string} Formatted CPF
   */
  formatCPF(cpf) {
    if (!cpf) return '';
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return cpf;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }

  /**
   * Formats a date to DD/MM/AAAA.
   * If already in DD/MM/AAAA format, returns as-is (passthrough).
   * If in YYYY-MM-DD format, converts to DD/MM/AAAA.
   * @param {string} date
   * @returns {string} Formatted date
   */
  formatDate(date) {
    if (!date) return '';

    // Already in DD/MM/AAAA format
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
      return date;
    }

    // Convert YYYY-MM-DD to DD/MM/AAAA
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split('-');
      return `${day}/${month}/${year}`;
    }

    return date;
  }

  /**
   * Formats a validity year to "12/AAAA".
   * @param {number|string} year
   * @returns {string} Formatted validity "12/AAAA"
   */
  formatValidity(year) {
    if (!year) return '';
    return `12/${year}`;
  }

  /**
   * Truncates text with "..." if it exceeds maxLength.
   * The returned string will have at most maxLength characters total (including "...").
   * @param {string} text - Original text
   * @param {number} maxLength - Maximum total characters allowed
   * @returns {string} Truncated or original text
   */
  truncateText(text, maxLength) {
    if (!text) return '';
    if (maxLength <= 0) return '';
    if (text.length <= maxLength) return text;
    if (maxLength <= 3) return '...'.slice(0, maxLength);
    return text.slice(0, maxLength - 3) + '...';
  }
}
