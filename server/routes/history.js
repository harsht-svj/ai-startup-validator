import express from 'express'
import validation from '../models/validation.js'

const router = express.Router()

import jwt from 'jsonwebtoken'

router.get('/history', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const validations = await Validation.find({ userId: decoded.id })
      .sort({ createdAt: -1 })
      .limit(10)
    res.json(validations)
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' })
  }
})

// Delete route
router.delete('/history/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const validation = await Validation.findOne({ _id: req.params.id, userId: decoded.id })
    if (!validation) return res.status(404).json({ error: 'Not found' })
    await validation.deleteOne()
    res.json({ message: 'Deleted successfully' })
  } catch (error) {
    res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router


