import { Router } from 'express'

import { tagsController } from '../controllers/tags.controller.js'
import { requireAuth } from '../middlewares/auth.js'

export const tagsRoutes = Router()

tagsRoutes.use(requireAuth)
tagsRoutes.post('/', tagsController.create)
tagsRoutes.get('/', tagsController.read)
tagsRoutes.patch('/', tagsController.update)
tagsRoutes.delete('/', tagsController.deleteByIds)
tagsRoutes.delete('/unused', tagsController.deleteUnused)
tagsRoutes.patch('/type', tagsController.changeType)
tagsRoutes.patch('/types', tagsController.setType)
tagsRoutes.patch('/count/increment', tagsController.increment)
tagsRoutes.patch('/count/decrement', tagsController.decrement)
tagsRoutes.post('/recount', tagsController.recount)
