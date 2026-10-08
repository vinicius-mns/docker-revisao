import type { Request, Response } from 'express'

import { HttpError } from '../middlewares/error.js'
import { tagsRepository } from '../repositories/tags.repository.js'
import * as schemas from '../schemas/tags.schema.js'

export const tagsController = {
  async create(req: Request, res: Response) {
    const data = await tagsRepository.create(schemas.createTagsBody.parse(req.body))
    res.status(201).json({ data, message: 'Tags criadas com sucesso' })
  },

  async read(req: Request, res: Response) {
    const data = await tagsRepository.read(schemas.readTagsQuery.parse(req.query))
    res.json({ data, message: 'Tags lidas com sucesso' })
  },

  async update(req: Request, res: Response) {
    await tagsRepository.update(schemas.updateTagsBody.parse(req.body))
    res.json({ data: true, message: 'Tags atualizadas com sucesso' })
  },

  async deleteByIds(req: Request, res: Response) {
    const { ids } = schemas.deleteTagsBody.parse(req.body)
    const data = await tagsRepository.deleteByIds(ids)
    res.json({ data, message: 'Tags deletadas com sucesso' })
  },

  async deleteUnused(_req: Request, res: Response) {
    const data = await tagsRepository.deleteUnused()
    res.json({ data, message: 'Tags não usadas removidas com sucesso' })
  },

  async changeType(req: Request, res: Response) {
    const { ids, type } = schemas.changeTypeBody.parse(req.body)
    const data = await tagsRepository.changeType(ids, type)
    res.json({ data, message: 'Tipo das tags atualizado com sucesso' })
  },

  async setType(req: Request, res: Response) {
    const data = await tagsRepository.setType(schemas.setTypeBody.parse(req.body))
    res.json({ data, message: 'Tipos das tags atualizados com sucesso' })
  },

  async increment(req: Request, res: Response) {
    const { ids, by } = schemas.incrementCountBody.parse(req.body)
    const data = await tagsRepository.increment(ids, by)
    res.json({ data, message: 'Contadores incrementados com sucesso' })
  },

  async decrement(req: Request, res: Response) {
    const { decrements } = schemas.decrementCountBody.parse(req.body)
    const data = await tagsRepository.decrement(decrements)
    res.json({ data, message: 'Contadores decrementados com sucesso' })
  },

  async recount(_req: Request, res: Response) {
    const data = await tagsRepository.recount()
    res.json({ data, message: 'Contadores recalculados com sucesso' })
  },
}
