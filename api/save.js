// Endpoint Serverless Vercel: Salva dados do estudante + foto para geração do PDF online
module.exports = async function handler(req, res) {
  // Configura cabeçalhos CORS
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
    const { code, nome, curso, instituicao, cpf, nascimento, validade, foto } = body || {};

    const safeCode = (code || '6382b41f').toLowerCase();

    const payload = {
      name: `cie_${safeCode}`,
      data: {
        code: safeCode,
        nome: nome || '',
        curso: curso || '',
        instituicao: instituicao || '',
        cpf: cpf || '',
        nascimento: nascimento || '',
        validade: validade || '',
        foto: foto || null
      }
    };

    const response = await fetch('https://api.restful-api.dev/objects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      return res.status(200).json({
        success: true,
        id: result.id,
        code: safeCode
      });
    } else {
      return res.status(500).json({ error: 'Falha ao armazenar dados do PDF.' });
    }
  } catch (error) {
    console.error('Erro no endpoint api/save.js:', error);
    return res.status(500).json({ error: 'Erro no servidor ao salvar PDF.' });
  }
};
