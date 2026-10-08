import type { Request, Response } from 'express'

import { HttpError } from '../middlewares/error.js'
import { cardsRepository } from '../repositories/cards.repository.js'
import * as schemas from '../schemas/cards.schema.js'

export const cardsController = {
  async create(req: Request, res: Response) {
    const data = await cardsRepository.create(schemas.createCardsBody.parse(req.body))
    res.status(201).json({ data, message: 'Cards criados com sucesso' })
  },

  async readById(req: Request, res: Response) {
    const id = String(req.params.id)
    const data = await cardsRepository.readById(id)

    if (!data) {
      throw new HttpError(404, 'Card não encontrado')
    }

    res.json({ data, message: 'Card lido com sucesso' })
  },

  async readByQuery(req: Request, res: Response) {
    const data = await cardsRepository.readByQuery(schemas.readCardsQuery.parse(req.query))
    res.json({ data, message: 'Cards lidos com sucesso' })
  },

  async update(req: Request, res: Response) {
    await cardsRepository.update(schemas.updateCardsBody.parse(req.body))
    res.json({ data: true, message: 'Cards atualizados com sucesso' })
  },

  async deleteByIds(req: Request, res: Response) {
    const { ids } = schemas.deleteCardsBody.parse(req.body)
    const data = await cardsRepository.deleteByIds(ids)
    res.json({ data, message: 'Cards deletados com sucesso' })
  },

  async deleteByTag(req: Request, res: Response) {
    const tagId = String(req.params.tagId)
    const data = await cardsRepository.deleteByTag(tagId)
    res.json({ data, message: 'Cards deletados com sucesso' })
  },

  async removeTags(req: Request, res: Response) {
    const { tagIds } = schemas.removeTagsBody.parse(req.body)
    const data = await cardsRepository.removeTags(tagIds)
    res.json({ data, message: 'Tags removidas com sucesso' })
  },
}
