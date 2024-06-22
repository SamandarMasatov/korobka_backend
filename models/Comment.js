import mongoose, { Types } from 'mongoose'

const shema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    owner: {
        type: Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    }
})


export default mongoose.model('Comment', shema)