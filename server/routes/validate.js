import express from 'express'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'
import validation from "../models/validation.js";
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
dotenv.config()

const router = express.Router()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

const investorPrompt = (idea) => `
You are a brutal but fair Silicon Valley investor with 20 years experience.
Analyze this startup idea: "${idea}"

Respond in EXACTLY this format, no extra text:
VERDICT: [One line brutal honest opinion]
MARKET: [One line on market size]
FUNDABILITY: [One line - would you fund or not]
KEY RISK: [Single biggest risk]
SCORE: [X/10]
`

const customerPrompt = (idea) => `
You are a potential customer who is smart and skeptical.
Analyze this startup idea: "${idea}"

Respond in EXACTLY this format, no extra text:
VERDICT: [One line - would you use it or not]
WOULD PAY: [Yes/No and how much]
MISSING: [One thing that would make you use it]
ANNOYS ME: [One thing that bothers you about it]
RATING: [X/10]
`

const competitorPrompt = (idea) => `
You are an aggressive competitor who already exists in this space.
Analyze this startup idea: "${idea}"

Respond in EXACTLY this format, no extra text:
VERDICT: [One line - threat or not]
HOW I CRUSH THEM: [One line strategy]
THEIR WEAKNESS: [Single fatal flaw]
CAN THEY SURVIVE: [Yes/No and why in one line]
FEAR LEVEL: [X/10]
`

const synthesizerPrompt = (idea, investor, customer, competitor) => `
You are a startup mentor synthesizing feedback from 3 experts on this idea: "${idea}"

Investor said: ${investor}
Customer said: ${customer}
Competitor said: ${competitor}

Respond in EXACTLY this format, no extra text:
MARKET DEMAND: [X/20]
REVENUE POTENTIAL: [X/20]
COMPETITION: [X/20]
SCALABILITY: [X/20]
EXECUTION: [X/20]
TOTAL SCORE: [X/100]
STRENGTH 1: [One line]
STRENGTH 2: [One line]
STRENGTH 3: [One line]
FATAL FLAW 1: [One line]
FATAL FLAW 2: [One line]
FATAL FLAW 3: [One line]
FIX 1: [One line]
FIX 2: [One line]
FIX 3: [One line]
`

const callGroq = async (prompt) => {
  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 300,
  })
  return response.choices[0].message.content
}

router.post('/validate', async (req, res) => {
  try {
    const { idea } = req.body
    if (!idea) return res.status(400).json({ error: 'Startup idea is required' })

    const token = req.headers.authorization?.split(' ')[1]
    if (!token) return res.status(401).json({ error: 'Please login first' })

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Check daily limit
const user = await User.findById(decoded.id)
const today = new Date().toDateString()
const lastDate = user.lastValidationDate 
  ? new Date(user.lastValidationDate).toDateString() 
  : null

if (lastDate === today && user.validationCount >= 5) {
  return res.status(429).json({ 
    error: 'Daily limit reached. You can validate 5 ideas per day. Come back tomorrow!' 
  })
}

// Reset count if new day
if (lastDate !== today) {
  user.validationCount = 0
}

// Increment count
user.validationCount += 1
user.lastValidationDate = new Date()
await user.save()

    console.log('Running 3 agents simultaneously... 🤖')

    const [investorFeedback, customerFeedback, competitorFeedback] = await Promise.all([
      callGroq(investorPrompt(idea)),
      callGroq(customerPrompt(idea)),
      callGroq(competitorPrompt(idea)),
    ])

    console.log('Running synthesizer agent... 🎯')

    const verdict = await callGroq(
      synthesizerPrompt(idea, investorFeedback, customerFeedback, competitorFeedback)
    )

    await Validation.create({
      userId: decoded.id,
      idea,
      agents: {
        investor: investorFeedback,
        customer: customerFeedback,
        competitor: competitorFeedback,
      },
      verdict,
    })

  res.json({
  idea,
  agents: {
    investor: investorFeedback,
    customer: customerFeedback,
    competitor: competitorFeedback,
  },
  verdict,
  remaining: 5 - user.validationCount,
})

  } catch (error) {
    console.log('Validate error:', error.message)
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Session expired. Please login again.' })
    }
    if (error.message?.includes('groq') || error.message?.includes('API')) {
      return res.status(503).json({ error: 'AI service temporarily unavailable. Try again in a moment.' })
    }
    res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
})
export default router