import mongoose, { Types } from 'mongoose'

const shema = new mongoose.Schema({
    owner: {
        type: Types.ObjectId,
        ref: 'User'
    },
    items: [{
        type: Types.ObjectId,
        ref: 'Product'
    }],
})


export default mongoose.model('Favorite', shema)