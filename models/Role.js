import mongoose, { Types } from 'mongoose'

const shema = new mongoose.Schema({
    role: {
        type: Number,
        required: true
    }
})

export default mongoose.model('Role', shema)