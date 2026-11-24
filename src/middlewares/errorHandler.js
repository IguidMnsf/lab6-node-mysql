class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON invalide' });
  }
  if (err instanceof AppError) return res.status(err.status).json({ error: err.message });
  if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Cette categorie existe deja' });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Categorie introuvable' });
  console.error('Erreur serveur:', err);
  return res.status(500).json({ error: 'Erreur interne du serveur' });
}

module.exports = errorHandler;
module.exports.AppError = AppError;
