import mongoose from 'mongoose'

const validationSchema = new mongoose.Schema({
  idea: {
    type: String,
    required: true,
  },
    userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  enhancedIdea: {
    type: String,
  },
  agents: {
    investor: String,
    customer: String,
    competitor: String,
  },
  verdict: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model('Validation', validationSchema)
