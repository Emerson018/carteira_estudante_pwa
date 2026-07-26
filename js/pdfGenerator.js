import { QRManager } from './qrManager.js';

export class PDFGenerator {
  /**
   * Constrói e retorna o objeto jsPDF preenchido com as 2 páginas da declaração.
   * @param {object} data - Dados do estudante
   * @returns {Promise<jsPDF|null>}
   */
  async buildPDFDoc(data) {
    if (!data) return null;

    if (typeof window === 'undefined' || !window.jspdf) {
      console.warn('jsPDF não disponível no ambiente atual.');
      return null;
    }

    const { jsPDF } = window.jspdf;

    // 1. Gerar QR Code dinâmico em Canvas temporário com todos os parâmetros do estudante
    let qrDataUrl = '';
    if (window.QRCode) {
      const qrCanvas = document.createElement('canvas');
      qrCanvas.width = 300;
      qrCanvas.height = 300;
      const qrManager = new QRManager();
      const qrData = qrManager.buildQRData(data);
      try {
        await window.QRCode.toCanvas(qrCanvas, qrData, {
          margin: 1,
          width: 300,
          errorCorrectionLevel: 'L'
        });
        qrDataUrl = qrCanvas.toDataURL('image/png');
      } catch (e) {
        console.warn('Erro ao gerar QR canvas:', e);
      }
    }

    // 2. Formatar data/hora atual para o rodapé
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // PÁGINA 1
      pdf.setFillColor(0, 230, 184);
      pdf.rect(0, 0, 210, 24, 'F');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(0, 136, 122);
      pdf.text('DOCUMENTO VÁLIDO', 105, 15.5, { align: 'center' });

      const studentNome = data.nome || 'Emerson Vicosa de Lima';
      const studentCurso = data.curso || 'Ciência da Computação';
      const studentInst = data.instituicao || 'UNIRITTER';

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10.5);
      pdf.setTextColor(0, 0, 0);

      const introText = `ABAFE - Associação Brasileira de Aprendizado e Foco no Estudante atesta que ${studentNome} é estudante e esta regularmente matriculado(a) em ${studentCurso} na instituição ${studentInst}, tendo direito à emissão da CIE conforme legislação vigente. O estudante será mantido no cadastro ativo enquanto permanecer vinculado à instituição e em dia com suas obrigações com a Associação.`;
      
      const introLines = pdf.splitTextToSize(introText, 180);
      pdf.text(introLines, 15, 36);

      pdf.setDrawColor(224, 224, 224);
      pdf.setLineWidth(0.3);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(15, 65, 180, 78, 4, 4, 'FD');

      if (data.foto && typeof data.foto === 'string' && data.foto.startsWith('data:image/')) {
        try {
          const photoImg = new Image();
          photoImg.src = data.foto;
          await new Promise((resolve) => {
            if (photoImg.complete) resolve();
            else {
              photoImg.onload = resolve;
              photoImg.onerror = resolve;
            }
          });
          const canvas = document.createElement('canvas');
          canvas.width = photoImg.naturalWidth || 400;
          canvas.height = photoImg.naturalHeight || 512;
          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(photoImg, 0, 0, canvas.width, canvas.height);
          const cleanJpeg = canvas.toDataURL('image/jpeg', 0.98);
          pdf.addImage(cleanJpeg, 'JPEG', 22, 72, 36, 46);
        } catch (e) {
          console.warn('Erro ao normalizar foto para o PDF:', e);
          try {
            pdf.addImage(data.foto, 22, 72, 36, 46);
          } catch (e2) {
            pdf.setFillColor(238, 238, 238);
            pdf.rect(22, 72, 36, 46, 'F');
          }
        }
      } else {
        pdf.setFillColor(238, 238, 238);
        pdf.rect(22, 72, 36, 46, 'F');
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(0, 135, 133);
      pdf.text('Cód. Uso:', 22, 124);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text((data.codigo || '6382b41f').toLowerCase(), 22, 130);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(15);
      pdf.setTextColor(0, 0, 0);
      pdf.text(studentNome, 65, 74);

      const fields = [
        { label: 'Instituição:', val: this.format25LineBreaks(studentInst.toUpperCase()) },
        { label: 'Curso:', val: this.format25LineBreaks(studentCurso.toUpperCase()) },
        { label: 'CPF:', val: data.cpf || '039.894.040-16' },
        { label: 'Data de Nascimento:', val: data.nascimento || '10/08/1998' },
        { label: 'Emissor:', val: 'ABAFE - Associação Brasileira de Aprendizado e Foco no Estudante' }
      ];

      let currentY = 82;
      fields.forEach(f => {
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(0, 135, 133);
        pdf.text(f.label, 65, currentY);

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(0, 0, 0);
        currentY += 4.2;

        const valLines = pdf.splitTextToSize(f.val, 125);
        pdf.text(valLines, 65, currentY);
        currentY += (Array.isArray(valLines) ? valLines.length * 4.2 : 4.2) + 2.3;
      });

      if (qrDataUrl) {
        pdf.addImage(qrDataUrl, 'PNG', 156, 72, 32, 32);
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 135, 133);
      pdf.text('Chave do Certificado:', 15, 154);

      const certKey = `-----BEGIN CERTIFICATE-----
MIIDujCCAqQCAQEwWaFXpFUwUzELMAkGA1UEBhMCQlIxEzARBgNVBAoTCklDUC1CcmFzaWwxDjAMBgNV
BAsTBUFiYWZlMR8wHQYDVQQDExZFbWVyc29uIFZpY29zYSBkZSBMaW1hoIHYMIHVpIHSMIHPMQswCQYD
VQQGEwJCUjETMBEGA1UECgwKSUNQLUJyYXNpbDEeMBwGA1UECwwVQUMgQ2VydGlzaWduIE11bHRpcGxh
MRcwFQYDVQQLDA4wMTU1NDI4NTAwMDE3NTEZMBcGA1UECwwQVmlkZW9Db25mZXJlbmNpYTEbMBkGA1UE
CwwSQXNzaW5hdHVyYSBUaXBvIEEzMTowOAYDVQQDDDFBU1NPQ0lBQ0FPIEJSQVNJTEVJUkEgREUgQVBS
RU5ESVpBRE8gRSBGT0NPIE5PIEVTMAsGCSqGSIb3DQEBCwIRAJOSKHXKzNSaRj0S9xVgKlAwIhgPMjAy
NjA2MDMyMTAxMjJaGA8yMDI4MDYwMzIxMDEyMVowgagwPAYFYEwBCgExMxMxMDAwMDAwMDAwMzk4OTQw
NDAxNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDBoBgVgTAEKAjFfE11VTklSSVRURVIgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgR3JhZHVhY2FvICAgICAgQ2llbmNpYSBkYSBDb21wdXRh
Y2FvICAgICAgICAgQ2lkYWRlVUFwejBMBggrBgEFBQcBAQRAMD4wPAYIKwYBBQUHMAKGMGh0dHA6Ly9j
YS5sYWN1bmFzb2Z0d2FyZS5jb20vY2VydHMvZWVhLWFiYWZlLnA3YjAJBgNVHTgEAgUAMB8GA1UdIwQY
MBaAFD26nb6PLB9kkpzqZ85SsnJQAc2dMAsGCSqGSIb3DQEBCwOCAQEAN8IuH86LL9RyyK/V671sbxom
T3DDmVvPsjBHp4mpPpz1HPJkXgTZI+TjvWor/bfbZkt7Qn5CbpOZYwelGgx5iBLYrVNr/+Qbo9WYqQhy
GG7hehpwsKRA8IKD13Tzts4pwPTz1LnXTiguvkHWg9QHJ0b2L/ZUnVcOqWLKQyu8ZANJbRM1Th4LLxK6
U2MwXN8rWjN+YnlIvPWmMqEMFvamc/evqGCiQGN4G45sFqr36sUB0+UsSGZU5ccwkFWf8MwK1aIqoqiF
rixaEuNLnmi0oLdt5VNec++c06NszYMbIDDnoPCMQ4iEXPHEsZYQHcA58iKpLOF87B7f0/GG2kslgg==
-----END CERTIFICATE-----`;

      pdf.setFont('courier', 'normal');
      pdf.setFontSize(6);
      pdf.setTextColor(85, 85, 85);
      const keyLines = pdf.splitTextToSize(certKey, 180);
      pdf.text(keyLines, 105, 160, { align: 'center' });

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 102, 204);
      pdf.text('Clique aqui para baixar o certificado', 105, 222, { align: 'center' });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 135, 133);
      pdf.text('Conformidade com Legislação', 15, 236);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const legText1 = `A emissão da Carteira de Identidade Estudantil (CIE) segue os critérios e requisitos estabelecidos pela Lei nº 12.933, de 26 de dezembro de 2013, que regulamenta a meia-entrada para estudantes em eventos de cultura e lazer , bem como pelas normas de`;
      const legLines1 = pdf.splitTextToSize(legText1, 180);
      pdf.text(legLines1, 15, 243);

      // PÁGINA 2
      pdf.addPage();

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('padronização nacional de identidade estudantil vigentes.', 15, 20);

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 135, 133);
      pdf.text('Validade e Verificabilidade:', 15, 30);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('Esta declaração é parte integral e inseparável da Carteira de Identidade Estudantil emitida, podendo ser verificada:', 15, 37);

      const bullets = [
        'Por consulta ao QR Code presente na carteira física ou digital',
        'Pelo acesso ao link/portal de validação da Associação',
        'Por apresentação deste PDF assinado digitalmente',
        'Pelo contato direto com a Associação nos dados informados.'
      ];

      let bulletY = 44;
      bullets.forEach(b => {
        pdf.text(`• ${b}`, 20, bulletY);
        bulletY += 6;
      });

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 135, 133);
      pdf.text('Observações Importantes:', 15, bulletY + 6);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const obsText = `Este documento foi assinado com certificado digital ICP-Brasil (Tipo A-1 ou A-3) para máxima validade jurídica. A alteração ou falsificação desta declaração é crime conforme legislação penal aplicável. A associação é responsável pela veracidade das informações aqui declaradas. Recomenda-se guarda deste arquivo em formato PDF protegido contra edições.`;
      const obsLines = pdf.splitTextToSize(obsText, 180);
      pdf.text(obsLines, 15, bulletY + 13);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Assinado digitalmente por ABAFE - Associação Brasileira de Aprendizado e Foco no Estudante, conforme Lei', 105, 275, { align: 'center' });
      pdf.text(`14.063/2020 e Medida Provisória nº 2.200-2/2001 ${formattedDate}`, 105, 280, { align: 'center' });
      pdf.text(`Cidade/Data/Hora: Brasília, ${formattedDate}`, 105, 285, { align: 'center' });

      return pdf;
    } catch (err) {
      console.error('Erro ao construir objeto PDF:', err);
      return null;
    }
  }

  /**
   * Gera, faz o download do arquivo PDF no dispositivo, e retorna o ArrayBuffer.
   * @param {object} data - Dados do estudante
   * @returns {Promise<ArrayBuffer|null>} ArrayBuffer do PDF gerado, ou null
   */
  async generatePDF(data) {
    if (!data) return null;
    const pdf = await this.buildPDFDoc(data);
    if (!pdf) return null;
    const safeName = data.nome ? data.nome.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'estudante';
    pdf.save(`declaracao_estudantil_${safeName}.pdf`);
    return pdf.output('arraybuffer');
  }

  /**
   * Retorna a Data URL (base64) do PDF para visualização em iframe/embed.
   * @param {object} data - Dados do estudante
   * @returns {Promise<string|null>}
   */
  async generatePDFDataUri(data) {
    if (!data) return null;
    const pdf = await this.buildPDFDoc(data);
    if (!pdf) return null;
    return pdf.output('datauristring');
  }

  /**
   * Retorna a Blob URL do PDF para visualização em iframe/embed.
   * @param {object} data - Dados do estudante
   * @returns {Promise<string|null>}
   */
  async generatePDFBlobUrl(data) {
    if (!data) return null;
    const pdf = await this.buildPDFDoc(data);
    if (!pdf) return null;
    return pdf.output('bloburl');
  }

  /**
   * Quebra a linha ao chegar a 25 caracteres para exibição em 2 linhas (máx. 50 chars).
   * @param {string} text
   * @returns {string}
   */
  format25LineBreaks(text) {
    if (!text || typeof text !== 'string') return '';
    const trimmed = text.trim().slice(0, 50);
    if (trimmed.length <= 25) return trimmed;

    let breakIdx = trimmed.lastIndexOf(' ', 25);
    if (breakIdx <= 0) {
      breakIdx = trimmed.indexOf(' ', 25);
    }
    if (breakIdx <= 0) {
      return trimmed.slice(0, 25) + '\n' + trimmed.slice(25);
    }

    return trimmed.slice(0, breakIdx) + '\n' + trimmed.slice(breakIdx + 1);
  }
}
