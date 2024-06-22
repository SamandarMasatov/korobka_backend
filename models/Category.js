import mongoose, { Types } from 'mongoose'

const shema = new mongoose.Schema({
    key: { 
        type: String,
        required: true,
        unique: true
    },
    value: { 
        type: String,
        required: true 
    }
})


export default mongoose.model('Category', shema)