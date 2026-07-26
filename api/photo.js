// Storage de Fotos por código do estudante (Serverless Photo Store)
const photosByCode = new Map();

module.exports = async function handler(req, res) {
  // Habilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const code = (req.query.code || (req.body && req.body.code) || '6382b41f').toLowerCase();

  // POST: Salvar foto enviada pelo PWA
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const photoData = body && (body.photo || body.foto);
      const studentCode = (body && body.code ? body.code : code).toLowerCase();

      if (photoData && typeof photoData === 'string') {
        photosByCode.set(studentCode, photoData);
        return res.status(200).json({ success: true, code: studentCode });
      }
      return res.status(400).json({ error: 'Foto não fornecida.' });
    } catch (e) {
      return res.status(500).json({ error: 'Erro ao processar foto.' });
    }
  }

  // GET: Obter foto armazenada pelo código
  if (req.method === 'GET') {
    const photo = photosByCode.get(code);
    if (photo) {
      return res.status(200).json({ code, photo });
    }
    return res.status(404).json({ error: 'Foto não encontrada.' });
  }

  return res.status(405).json({ error: 'Método não permitido.' });
};

module.exports.getPhotoByCode = function(code) {
  if (!code) return null;
  return photosByCode.get(code.toLowerCase()) || null;
};

module.exports.setPhotoForCode = function(code, photo) {
  if (!code || !photo) return;
  photosByCode.set(code.toLowerCase(), photo);
};
