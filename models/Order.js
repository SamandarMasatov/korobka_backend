import mongoose, { Types } from 'mongoose'

const shema = new mongoose.Schema({
    owner: {
        type: Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items: [{
        productId: {
            type: Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: Types.ObjectId,
        default: "665330eb7deaa84b374c0988",
        ref: 'Order_status'
    },
    address: {
        type: String,
        required: true
    },
    wayPay: {
        type: Types.ObjectId,
        ref: 'Way_pay'
    },
    createdOrder: {
        type: Date,
        default: Date.now,
    },
    updatedOrder: {
        type: Date,
    }
})

export default mongoose.model('Order', shema)