const service = require('../services/categoryService');

module.exports = {
  list: async (req, res, next) => { try { res.json(await service.list()); } catch (e) { next(e); } },
  get: async (req, res, next) => { try { res.json(await service.get(req.params.id)); } catch (e) { next(e); } },
  create: async (req, res, next) => { try { res.status(201).json(await service.create(req.body)); } catch (e) { next(e); } },
  update: async (req, res, next) => { try { res.json(await service.update(req.params.id, req.body)); } catch (e) { next(e); } },
  remove: async (req, res, next) => { try { await service.remove(req.params.id); res.status(204).end(); } catch (e) { next(e); } }
};
