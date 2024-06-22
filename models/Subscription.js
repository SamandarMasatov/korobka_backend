import mongoose, { Types } from 'mongoose'

const shema = new mongoose.Schema({
    email: {
        type: String,
    }
})


export default mongoose.model('Subscription', shema)