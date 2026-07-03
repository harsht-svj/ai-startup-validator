import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
    validationCount:
  { type: Number,
     default: 0
 },
  lastValidationDate:
 { type: Date,
 default: null 
},
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

// Password hash karo save se pehle
// Password hash karo save se pehle
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 10)
})

// Password compare karo
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

export default mongoose.model('User', userSchema)