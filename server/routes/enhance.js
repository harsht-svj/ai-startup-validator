import express from 'express'
import Groq from 'groq-sdk'
import dotenv from 'dotenv'
dotenv.config()

const router = express.Router()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

router.post('/enhance', async (req, res) => {
  try {
    const { rawIdea } = req.body

    if (!rawIdea) {
      return res.status(400).json({ error: 'Raw idea is required' })
    }

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: `You are a startup pitch expert. Convert this raw idea into a professional, clear, and compelling startup idea description in 2-3 sentences. Keep it concise but impressive. Raw idea: "${rawIdea}". Return only the enhanced idea, nothing else.`
        }
      ],
      max_tokens: 200,
    })

    const enhanced = response.choices[0].message.content
    res.json({ enhanced })

  } catch (error) {
    console.log('Error:', error)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

export default router