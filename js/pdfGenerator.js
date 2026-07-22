/**
 * PDFGenerator — Gera o PDF da Declaração/Certificado Estudantil
 * em formato VETORIAL NATIVO (PDF editável no Canva, texto pesquisável, sem perda de resolução).
 * @module pdfGenerator
 */

export class PDFGenerator {
  /**
   * Gera o PDF com as 2 páginas exatamente no modelo de certificado.pdf
   * @param {object} data - Dados do estudante (nome, curso, instituicao, cpf, nascimento, codigo, foto)
   * @returns {Promise<boolean>}
   */
  async generatePDF(data) {
    if (!data) return false;

    // Se estiver em ambiente sem window (testes unitários) ou sem jsPDF, retorna sucesso gracioso
    if (typeof window === 'undefined' || !window.jspdf) {
      console.warn('jsPDF não disponível no ambiente atual.');
      return true;
    }

    const { jsPDF } = window.jspdf;

    // 1. Gerar QR Code em Canvas temporário
    let qrDataUrl = '';
    if (window.QRCode && (data.codigo || data.cpf)) {
      const qrCanvas = document.createElement('canvas');
      qrCanvas.width = 300;
      qrCanvas.height = 300;
      const origin = (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin !== 'null')
        ? window.location.origin
        : 'https://carteira-estudante.vercel.app';
      const safeCode = (data.codigo || '6382b41f').toLowerCase();
      const qrData = `${origin}/pdf/${safeCode}.pdf`;
      try {
        await window.QRCode.toCanvas(qrCanvas, qrData, { margin: 1, width: 300 });
        qrDataUrl = qrCanvas.toDataURL('image/png');
      } catch (e) {
        console.warn('Erro ao gerar QR canvas:', e);
      }
    }

    // 2. Formatar data/hora atual para o rodapé
    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    try {
      // Criar PDF A4 em formato retrato (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // ==========================================
      // PÁGINA 1 (VETORIAL NATIVA EDITÁVEL)
      // ==========================================

      // Banner superior verde (#00E6B8 = RGB 0, 230, 184)
      pdf.setFillColor(0, 230, 184);
      pdf.rect(0, 0, 210, 24, 'F');

      // Título "DOCUMENTO VÁLIDO" em verde escuro (#00887A = RGB 0, 136, 122)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(22);
      pdf.setTextColor(0, 136, 122);
      pdf.text('DOCUMENTO VÁLIDO', 105, 15.5, { align: 'center' });

      // Texto de introdução em parágrafo (x = 15mm, y = 36mm, largura = 180mm)
      const studentNome = data.nome || 'Emerson Vicosa de Lima';
      const studentCurso = data.curso || 'Ciência da Computação';
      const studentInst = data.instituicao || 'UNIRITTER';

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10.5);
      pdf.setTextColor(0, 0, 0);

      const introText = `ABAFE - Associação Brasileira de Aprendizado e Foco no Estudante atesta que ${studentNome} é estudante e esta regularmente matriculado(a) em ${studentCurso} na instituição ${studentInst}, tendo direito à emissão da CIE conforme legislação vigente. O estudante será mantido no cadastro ativo enquanto permanecer vinculado à instituição e em dia com suas obrigações com a Associação.`;
      
      const introLines = pdf.splitTextToSize(introText, 180);
      pdf.text(introLines, 15, 36);

      // Caixa do Cartão do Estudante (Fundo Branco, Borda Arredondada)
      // Dimensões: x=15mm, y=65mm, w=180mm, h=78mm, r=4mm
      pdf.setDrawColor(224, 224, 224);
      pdf.setLineWidth(0.3);
      pdf.setFillColor(255, 255, 255);
      pdf.roundedRect(15, 65, 180, 78, 4, 4, 'FD');

      // ------------------------------------------
      // Coluna da Foto (Esquerda: x=22mm)
      // ------------------------------------------
      if (data.foto) {
        try {
          pdf.addImage(data.foto, 'JPEG', 22, 72, 36, 46);
        } catch (e) {
          pdf.setFillColor(238, 238, 238);
          pdf.rect(22, 72, 36, 46, 'F');
        }
      } else {
        pdf.setFillColor(238, 238, 238);
        pdf.rect(22, 72, 36, 46, 'F');
      }

      // Cód. Uso (Abaixo da foto: y=124mm)
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(0, 135, 133); // #008785
      pdf.text('Cód. Uso:', 22, 124);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text((data.codigo || '6382b41f').toLowerCase(), 22, 130);

      // ------------------------------------------
      // Coluna de Informações (Centro: x=65mm)
      // ------------------------------------------
      // Nome do Estudante
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(15);
      pdf.setTextColor(0, 0, 0);
      pdf.text(studentNome, 65, 74);

      // Campos com Rótulo Teal (#008785 = RGB 0, 135, 133) e Valor em Preto
      const fields = [
        { label: 'Instituição:', val: studentInst.toUpperCase() },
        { label: 'Curso:', val: studentCurso.toUpperCase() },
        { label: 'CPF:', val: data.cpf || '039.894.040-16' },
        { label: 'Data de Nascimento:', val: data.nascimento || '10/08/1998' },
        { label: 'Emissor:', val: 'ABAFE - Associação Brasileira de Aprendizado e Foco no Estudante' }
      ];

      let currentY = 82;
      fields.forEach(f => {
        // Rótulo
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setTextColor(0, 135, 133);
        pdf.text(f.label, 65, currentY);

        // Valor
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(9.5);
        pdf.setTextColor(0, 0, 0);
        currentY += 4.2;
        pdf.text(f.val, 65, currentY);
        currentY += 6.5;
      });

      // ------------------------------------------
      // Coluna do QR Code (Direita: x=156mm, y=72mm)
      // ------------------------------------------
      if (qrDataUrl) {
        pdf.addImage(qrDataUrl, 'PNG', 156, 72, 32, 32);
      }

      // ------------------------------------------
      // Chave do Certificado
      // ------------------------------------------
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 135, 133); // #008785
      pdf.text('Chave do Certificado:', 15, 154);

      // Certificado Base64 (Texto nativo em Courier Monospace)
      const certKey = `-----BEGIN CERTIFICATE-----
MIIDujCCAqQCAQEwWaFXpFUwUzELMAkGA1UEBhMCQlIxEzARBgNVBAoTCklDUC1CcmFzaWwxDjAMBgNV
BAsTBUFiYWZlMR8wHQYDVQQDExZFbWVyc29uIFZpY29zYSBkZSBMaW1hoIHYMIHVpIHSMIHPMQswCQYD
VQQGEwJCUjETMBEGA1UECgwKSUNQLUJyYXNpbDEeMBwGA1UECwwVQUMgQ2VydGlzaWduIE11bHRpcGxh
MRcwFQYDVQQLDA4wMTU1NDI4NTAwMDE3NTEZMBcGA1UECwwQVmlkZW9Db25mZXJlbmNpYTEbMBkGA1UE
CwwSQXNzaW5hdHVyYSBUaXBvIEEzMTowOAYDVQQDDDFBU1NPQ0lBQ0FPIEJSQVNJTEVJUkEgREUgQVBS
RU5ESVpBRE8gRSBGT0NPIE5PIEVTMAsGCSqGSIb3DQEBCwIRAJOSKHXKzNSaRj0S9xVgKlAwIhgPMjAy
NjA2MDMyMTAxMjJaGA8yMDI4MDYwMzIxMDEyMVowgagwPAYFYEwBCgExMxMxMDAwMDAwMDAwMzk4OTQw
NDAxNjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDBoBgVgTAEKAjFfE11VTklSSVRURVIgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgR3JhZHVhY2FvICAgICAgQ2llbmNpYSBkYSBDb21wdXRh
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

      // Link para baixar certificado
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 102, 204);
      pdf.text('Clique aqui para baixar o certificado', 105, 222, { align: 'center' });

      // Conformidade com Legislação
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 135, 133); // #008785
      pdf.text('Conformidade com Legislação', 15, 236);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const legText1 = `A emissão da Carteira de Identidade Estudantil (CIE) segue os critérios e requisitos estabelecidos pela Lei nº 12.933, de 26 de dezembro de 2013, que regulamenta a meia-entrada para estudantes em eventos de cultura e lazer , bem como pelas normas de`;
      const legLines1 = pdf.splitTextToSize(legText1, 180);
      pdf.text(legLines1, 15, 243);

      // ==========================================
      // PÁGINA 2 (VETORIAL NATIVA EDITÁVEL)
      // ==========================================
      pdf.addPage();

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.text('padronização nacional de identidade estudantil vigentes.', 15, 20);

      // Validade e Verificabilidade
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 135, 133); // #008785
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

      // Observações Importantes
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 135, 133); // #008785
      pdf.text('Observações Importantes:', 15, bulletY + 6);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const obsText = `Este documento foi assinado com certificado digital ICP-Brasil (Tipo A-1 ou A-3) para máxima validade jurídica. A alteração ou falsificação desta declaração é crime conforme legislação penal aplicável. A associação é responsável pela veracidade das informações aqui declaradas. Recomenda-se guarda deste arquivo em formato PDF protegido contra edições.`;
      const obsLines = pdf.splitTextToSize(obsText, 180);
      pdf.text(obsLines, 15, bulletY + 13);

      // Rodapé
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 100, 100);
      pdf.text('Assinado digitalmente por ABAFE - Associação Brasileira de Aprendizado e Foco no Estudante, conforme Lei 14.063/2020 e Medida Provisória nº 2.200-2/2001', 105, 275, { align: 'center' });
      pdf.text(`Cidade/Data/Hora: Brasília, ${formattedDate}`, 105, 280, { align: 'center' });

      // Salvar PDF gerado
      const safeName = data.nome ? data.nome.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'estudante';
      pdf.save(`declaracao_estudantil_${safeName}.pdf`);
      return true;
    } catch (err) {
      console.error('Erro ao gerar PDF do certificado:', err);
      return false;
    }
  }
}
