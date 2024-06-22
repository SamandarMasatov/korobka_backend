import mongoose, { Types } from 'mongoose'

const shema = new mongoose.Schema({
    owner: {
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    },
    product: {
        type: Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    text: {
        type: String,
        required: true,
    },
    stars: {
        type: Number,
        required: true,
        default: 0,
    },
    date: {
        type: Date,
        required: true,
        default: Date.now,
    },
    slider: {
        type: [String],
        default: [],
    },
    comments: {
        type: [{
            type: Types.ObjectId,
            ref: 'Comment',
        }],
        default: [],
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
})

export default mongoose.model('Review', shema)