import express from 'express'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'
dotenv.config()

const router = express.Router()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

router.post('/roadmap', async (req, res) => {
  try {
    const { idea, verdict } = req.body

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `You are a startup advisor. Based on this idea and its validation verdict, create a 3-month startup roadmap.

Idea: "${idea}"
Verdict Summary: "${verdict}"

Respond in EXACTLY this format, no extra text:
MONTH 1 TITLE: [Foundation phase title]
MONTH 1 FOCUS: [Main goal in one line]
MONTH 1 TASK 1: [Specific task]
MONTH 1 TASK 2: [Specific task]
MONTH 1 TASK 3: [Specific task]
MONTH 1 MILESTONE: [What you should have by end of month 1]

MONTH 2 TITLE: [Build phase title]
MONTH 2 FOCUS: [Main goal in one line]
MONTH 2 TASK 1: [Specific task]
MONTH 2 TASK 2: [Specific task]
MONTH 2 TASK 3: [Specific task]
MONTH 2 MILESTONE: [What you should have by end of month 2]

MONTH 3 TITLE: [Launch phase title]
MONTH 3 FOCUS: [Main goal in one line]
MONTH 3 TASK 1: [Specific task]
MONTH 3 TASK 2: [Specific task]
MONTH 3 TASK 3: [Specific task]
MONTH 3 MILESTONE: [What you should have by end of month 3]

QUICK WIN: [One thing to do in first week]
BIGGEST RISK: [Single biggest risk to watch out for]`
      }],
      max_tokens: 500,
    })

    res.json({ roadmap: response.choices[0].message.content })
  } catch (error) {
    console.log('Roadmap error:', error.message)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router