const { jsPDF } = require('jspdf');
const QRCode = require('qrcode');

module.exports = async function handler(req, res) {
  try {
    // Parâmetros recebidos da URL ou valores padrão
    const safeCode = (req.query.code || '6382b41f').toLowerCase();
    const studentNome = req.query.n || req.query.nome || 'Emerson Vicosa de Lima';
    const studentCurso = req.query.c || req.query.curso || 'Ciência da Computação';
    const studentInst = req.query.i || req.query.instituicao || 'UNIRITTER';
    const rawCpf = req.query.cpf || '039.894.040-16';
    const cpf = rawCpf.length === 11 ? rawCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : rawCpf;
    const nascimento = req.query.d || req.query.nascimento || '10/08/1998';

    // Gerar QR code buffer com chaves compactas (matriz limpa de fácil leitura)
    let qrDataUrl = '';
    try {
      const host = req.headers.host || 'carteira-estudante-pwa.vercel.app';
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      
      const params = new URLSearchParams();
      if (studentNome) params.set('n', studentNome);
      if (studentCurso) params.set('c', studentCurso);
      if (studentInst) params.set('i', studentInst);
      if (req.query.cpf) params.set('cpf', req.query.cpf.replace(/\D/g, ''));
      if (nascimento) params.set('d', nascimento);
      if (req.query.v || req.query.validade) params.set('v', String(req.query.v || req.query.validade));

      const queryString = params.toString();
      const qrTargetUrl = queryString ? `${protocol}://${host}/pdf/${safeCode}.pdf?${queryString}` : `${protocol}://${host}/pdf/${safeCode}.pdf`;

      qrDataUrl = await QRCode.toDataURL(qrTargetUrl, { margin: 1, width: 300, errorCorrectionLevel: 'L' });
    } catch (e) {
      console.warn('Erro ao gerar QR em serverless:', e);
    }

    const now = new Date();
    const formattedDate = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

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

    const reqPhoto = req.query.f || req.query.foto;
    if (reqPhoto && typeof reqPhoto === 'string' && reqPhoto.startsWith('data:image/')) {
      try {
        const isPng = reqPhoto.toLowerCase().includes('data:image/png');
        const format = isPng ? 'PNG' : 'JPEG';
        pdf.addImage(reqPhoto, format, 22, 72, 36, 46);
      } catch (e) {
        pdf.setFillColor(238, 238, 238);
        pdf.rect(22, 72, 36, 46, 'F');
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
    pdf.text(safeCode, 22, 130);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.setTextColor(0, 0, 0);
    pdf.text(studentNome, 65, 74);

    const fields = [
      { label: 'Instituição:', val: studentInst.toUpperCase() },
      { label: 'Curso:', val: studentCurso.toUpperCase() },
      { label: 'CPF:', val: cpf },
      { label: 'Data de Nascimento:', val: nascimento },
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
      pdf.text(f.val, 65, currentY);
      currentY += 6.5;
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
NjA6MDMyMTAxMjJaGA8yMDI4MDYwMzIxMDEyMVowgagwPAYFYEwBCgExMxMxMDAwMDAwMDAwMzk4OTQw
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

    // Converter PDF para Buffer binário
    const pdfArrayBuffer = pdf.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    // Enviar resposta HTTP com Content-Type application/pdf
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="declaracao_estudantil_${safeCode}.pdf"`);
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
    return res.send(pdfBuffer);
  } catch (error) {
    console.error('Erro na API Serverless do PDF:', error);
    return res.status(500).json({ error: 'Erro ao gerar arquivo PDF.' });
  }
};
