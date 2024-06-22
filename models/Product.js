import mongoose, {Types} from 'mongoose'

const shema = new mongoose.Schema({
    img: {
        type: String,
        required: true
    },
    slider: [{
        type: String
    }],
    title: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    preText: {
        type: String,
        required: true
    },
    pageDesc: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    category: [{
        type: Types.ObjectId,
        ref: 'Category',
        required: true
    }],
})

export default mongoose.model('Product', shema)