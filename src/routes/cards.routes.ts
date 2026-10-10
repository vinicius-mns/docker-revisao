import { Router } from 'express'

import { cardsController } from '../controllers/cards.controller.js'
import { requireAuth } from '../middlewares/auth.js'

export const cardsRoutes = Router()

cardsRoutes.use(requireAuth)
cardsRoutes.get('/', cardsController.readByQuery)
cardsRoutes.get('/:id', cardsController.readById)
cardsRoutes.post('/', cardsController.create)
cardsRoutes.patch('/', cardsController.update)
cardsRoutes.patch('/remove-tags', cardsController.removeTags)
cardsRoutes.delete('/', cardsController.deleteByIds)
cardsRoutes.delete('/by-tag/:tagId', cardsController.deleteByTag)
