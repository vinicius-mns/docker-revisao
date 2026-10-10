import type { Request, Response } from 'express'

import { HttpError } from '../middlewares/error.js'
import { cardsRepository } from '../repositories/cards.repository.js'
import * as schemas from '../schemas/cards.schema.js'

const userId = (req: Request) => {
  if (!req.auth?.userId) {
    throw new HttpError(401, 'Autenticação necessária')
  }
  return req.auth.userId
}

export const cardsController = {
  async create(req: Request, res: Response) {
    const data = await cardsRepository.create(userId(req), schemas.createCardsBody.parse(req.body))
    res.status(201).json({ data, message: 'Cards criados com sucesso' })
  },

  async readById(req: Request, res: Response) {
    const id = String(req.params.id)
    const data = await cardsRepository.readById(userId(req), id)

    if (!data) {
      throw new HttpError(404, 'Card não encontrado')
    }

    res.json({ data, message: 'Card lido com sucesso' })
  },

  async readByQuery(req: Request, res: Response) {
    const data = await cardsRepository.readByQuery(userId(req), schemas.readCardsQuery.parse(req.query))
    res.json({ data, message: 'Cards lidos com sucesso' })
  },

  async update(req: Request, res: Response) {
    await cardsRepository.update(userId(req), schemas.updateCardsBody.parse(req.body))
    res.json({ data: true, message: 'Cards atualizados com sucesso' })
  },

  async deleteByIds(req: Request, res: Response) {
    const { ids } = schemas.deleteCardsBody.parse(req.body)
    const data = await cardsRepository.deleteByIds(userId(req), ids)
    res.json({ data, message: 'Cards deletados com sucesso' })
  },

  async deleteByTag(req: Request, res: Response) {
    const tagId = String(req.params.tagId)
    const data = await cardsRepository.deleteByTag(userId(req), tagId)
    res.json({ data, message: 'Cards deletados com sucesso' })
  },

  async removeTags(req: Request, res: Response) {
    const { tagIds } = schemas.removeTagsBody.parse(req.body)
    const data = await cardsRepository.removeTags(userId(req), tagIds)
    res.json({ data, message: 'Tags removidas com sucesso' })
  },
}
