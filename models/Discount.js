import mongoose, { Types } from 'mongoose'

const shema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    remainingUses: {
        type: Number,
        default: 1
    },
    percentage: {
        type: Number,
        required: true
    }
})


export default mongoose.model('Discount', shema)