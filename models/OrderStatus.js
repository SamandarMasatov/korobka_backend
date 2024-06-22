import mongoose, { Types } from 'mongoose'

const shema = new mongoose.Schema({
    name: {
        type: String,
    },
    color: {
        type: String,
    }
})


export default mongoose.model('Order_status', shema)