import mongoose, { Types } from 'mongoose'

const shema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    }
})


export default mongoose.model('Way_pay', shema)