import express from 'express'
import jwt from 'jsonwebtoken'
import passport from 'passport'
import User from '../models/User.js'

const router = express.Router()

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body
    const existingUser = await User.findOne({ email })
    if (existingUser) return res.status(400).json({ error: 'Email already exists' })
    const user = await User.create({ name, email, password })
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } })
  }  catch (err) {
    console.log('Register error:', err.message)
    res.status(500).json({ error: err.message })
}
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ error: 'Email not found' })
    const isMatch = await user.comparePassword(password)
    if (!isMatch) return res.status(400).json({ error: 'Wrong password' })
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } })
  } catch (err) {
    console.log('Login error:', err.message)
    res.status(500).json({ error: err.message })
  }
})
// Get current user
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) return res.status(401).json({ error: 'No token' })
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id)
    if (!user) return res.status(401).json({ error: 'User not found' })
    res.json({ user: { id: user._id, name: user.name, email: user.email } })
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
})
export default router