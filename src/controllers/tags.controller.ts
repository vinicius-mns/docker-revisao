import type { Request, Response } from 'express'

import { HttpError } from '../middlewares/error.js'
import { tagsRepository } from '../repositories/tags.repository.js'
import * as schemas from '../schemas/tags.schema.js'

const userId = (req: Request) => {
  if (!req.auth?.userId) {
    throw new HttpError(401, 'Autenticação necessária')
  }
  return req.auth.userId
}

export const tagsController = {
  async create(req: Request, res: Response) {
    const data = await tagsRepository.create(userId(req), schemas.createTagsBody.parse(req.body))
    res.status(201).json({ data, message: 'Tags criadas com sucesso' })
  },

  async read(req: Request, res: Response) {
    const data = await tagsRepository.read(userId(req), schemas.readTagsQuery.parse(req.query))
    res.json({ data, message: 'Tags lidas com sucesso' })
  },

  async update(req: Request, res: Response) {
    await tagsRepository.update(userId(req), schemas.updateTagsBody.parse(req.body))
    res.json({ data: true, message: 'Tags atualizadas com sucesso' })
  },

  async deleteByIds(req: Request, res: Response) {
    const { ids } = schemas.deleteTagsBody.parse(req.body)
    const data = await tagsRepository.deleteByIds(userId(req), ids)
    res.json({ data, message: 'Tags deletadas com sucesso' })
  },

  async deleteUnused(req: Request, res: Response) {
    const data = await tagsRepository.deleteUnused(userId(req))
    res.json({ data, message: 'Tags não usadas removidas com sucesso' })
  },

  async changeType(req: Request, res: Response) {
    const { ids, type } = schemas.changeTypeBody.parse(req.body)
    const data = await tagsRepository.changeType(userId(req), ids, type)
    res.json({ data, message: 'Tipo das tags atualizado com sucesso' })
  },

  async setType(req: Request, res: Response) {
    const data = await tagsRepository.setType(userId(req), schemas.setTypeBody.parse(req.body))
    res.json({ data, message: 'Tipos das tags atualizados com sucesso' })
  },

  async increment(req: Request, res: Response) {
    const { ids, by } = schemas.incrementCountBody.parse(req.body)
    const data = await tagsRepository.increment(userId(req), ids, by)
    res.json({ data, message: 'Contadores incrementados com sucesso' })
  },

  async decrement(req: Request, res: Response) {
    const { decrements } = schemas.decrementCountBody.parse(req.body)
    const data = await tagsRepository.decrement(userId(req), decrements)
    res.json({ data, message: 'Contadores decrementados com sucesso' })
  },

  async recount(req: Request, res: Response) {
    const data = await tagsRepository.recount(userId(req))
    res.json({ data, message: 'Contadores recalculados com sucesso' })
  },
}
