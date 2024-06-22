import mongoose, { Types } from 'mongoose'

const shema = new mongoose.Schema({
    photo: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
})


export default mongoose.model('Box_type', shema)