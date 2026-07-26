const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  // Habilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { code, pdfBase64 } = body || {};

    if (!code || !pdfBase64) {
      return res.status(400).json({ error: 'Código e PDF são obrigatórios.' });
    }

    // Converte base64 para Buffer
    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    // Salva no Vercel Blob com nome fixo por código (sobrescreve se já existir)
    const blob = await put(`pdfs/${code.toLowerCase()}.pdf`, pdfBuffer, {
      access: 'public',
      contentType: 'application/pdf',
      addRandomSuffix: false
    });

    return res.status(200).json({
      success: true,
      url: blob.url,
      code: code.toLowerCase()
    });
  } catch (error) {
    console.error('Erro ao salvar PDF no Vercel Blob:', error);
    return res.status(500).json({ error: 'Erro ao salvar PDF. Verifique o BLOB_READ_WRITE_TOKEN.' });
  }
};
