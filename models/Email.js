import mongoose, { Types } from 'mongoose'

const shema = new mongoose.Schema({
    email: {
        type: String,
    },
    created_at: {
        type: Date,
        default: Date.now
    }
})


export default mongoose.model('Email', shema)