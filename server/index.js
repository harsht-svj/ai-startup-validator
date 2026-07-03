
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import validateRoute from './routes/validate.js'
import enhanceRoute from './routes/enhance.js'
import historyRoute from './routes/history.js'

import passport from 'passport'
import './config/passport.js'
import authRoute from './routes/auth.js'
import roadmapRoute from './routes/roadmap.js'

dotenv.config()
console.log("MONGO_URI loaded:", process.env.MONGO_URL);

const app = express()

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'DELETE'],
}))

app.use(express.json())

// Passport initialize
app.use(passport.initialize())

// Routes
app.use('/api', validateRoute)
app.use('/api', enhanceRoute)
app.use('/api', historyRoute)
app.use('/api', roadmapRoute)

app.use('/api/auth', authRoute)
// MongoDB connect
mongoose.connect(process.env.MONGO_URL, {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log('MongoDB connected ✅'))
  .catch((err) => console.log('MongoDB error:', err.message))

  
const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`))