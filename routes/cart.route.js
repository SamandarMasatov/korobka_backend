import {Router, response} from 'express'

import User from '../models/User.js'
import CartItem from '../models/Cart.js'
import verifyToken from '../validation/verifyToken.js'
import Discount from '../models/Discount.js'
import Cart from '../models/Cart.js'

const cartRoute = Router()

cartRoute.post('/add/:itemId', verifyToken, async (req, res) => {
    try {
        const userId = req.userId
        const itemId = req.params.itemId
        const cartItem = await CartItem.findOne({owner: userId})

        if (cartItem) {
            if (cartItem.items.length == 0) {

                const newItem = {
                    product: itemId,
                    quantity: 1
                };

                const item = await CartItem.findOneAndUpdate(
                                        { owner: userId },
                                        { $push: { items: newItem } },
                                        { new: true }
                ).populate('items.product');
            
                const addedItem = item.items.find(item => item.product._id.toString() === itemId.toString());

                const productNew = addedItem.product;
                const count = addedItem.quantity;

                const product = {
                    _id: productNew._id.toString(),
                    img: productNew.img,
                    title: productNew.title,
                    preText: productNew.preText,
                    price: productNew.price,
                    count: count,
                }

                res.status(200).json({ ...product });

            } else {

                const existingItem = cartItem.items.find((item) => item.product.equals(itemId));

                if (existingItem) {
                    const item = await CartItem.findOneAndUpdate(
                        { owner: userId, items: { $elemMatch: { product: itemId } } },
                        { $inc: { 'items.$.quantity': 1 } },
                        { new: true }
                    ).populate('items.product');

                    const addedItem = item.items.find(item => item.product._id.toString() === itemId.toString());

                    const productNew = addedItem.product;
                    const count = addedItem.quantity;

                    const product = {
                        ...productNew._doc,
                        count: count,
                    }

                    res.status(200).json({ ...product });

                } else {
                    const newItem = {
                        product: itemId,
                        quantity: 1
                    };
    
                    const item = await CartItem.findOneAndUpdate(
                        { owner: userId },
                        { $push: { items: newItem } },
                        { new: true }
                    ).populate('items.product');

                    const addedItem = item.items.find(item => item.product._id.toString() === itemId.toString());

                    const productNew = addedItem.product;
                    const count = addedItem.quantity;

                    const product = {
                        ...productNew._doc,
                        count: count,
                    }

                    res.status(200).json({ ...product });
                }
            }
        } else {
            const item = {
                product: itemId,
                quantity: 1
            };
            await CartItem.create({ owner: userId, items: [item]});
            const newCartItem = await CartItem.find({ owner: userId, items: { $elemMatch: { product: itemId } } })
                                                .populate('items.product');

            await User.findByIdAndUpdate({_id: userId}, {cart: newCartItem[0]._id})

            const productNew = newCartItem[0].items[0].product;
            const count = newCartItem[0].items[0].quantity

            const product = {
                ...productNew._doc,
                count: count,
            }

            res.status(200).json({ ...product })
        }

    } catch (error) {
        res.status(400).json({error: error.message})
    }
})

cartRoute.delete('/delete/:productId', verifyToken, async (req, res) => {
    const productId = req.params.productId
    const userId = req.userId
    await CartItem.updateOne({owner: userId}, { $pull: { items: { product: productId } } }, { new: true })
        .then((response) => res.status(200).json({delete: response.acknowledged}))
        .catch((error) => res.status(400).json({delete: error.acknowledged}))
})

cartRoute.post('/increase', verifyToken, async (req, res) => {
    try {
        const productId = req.body.id;
        const userId = req.userId;
        await CartItem.updateOne(
            { owner: userId, 'items.product': productId},
            { $inc: { 'items.$.quantity': 1 } },
            { new: true })
            .then((response) => res.status(200).json({increase: response.acknowledged}))
            .catch((error) => res.status(400).json({increase: error.acknowledged}))
    } catch (error) {
        res.status(400).json({error: error.message})
    }
})

cartRoute.post('/decrease', verifyToken, async (req, res) => {
    try {
        const productId = req.body.id;
        const userId = req.userId
        await CartItem.updateOne(
            { owner: userId, 'items.product': productId},
            { $inc: { 'items.$.quantity': - 1 } },
            { new: true })
            .then((response) => res.status(200).json({increase: response.acknowledged}))
            .catch((error) => res.status(400).json({increase: error.acknowledged}))
    } catch (error) {
        res.status(400).json({error: error.message})
    }
})

cartRoute.post('/update-item', verifyToken, async (req, res) => {
    try {
        const productId = req.body.id;
        const productCount = req.body.count
        const userId = req.userId

        await CartItem.updateOne(
            { owner: userId, 'items.product': productId},
            { $set: { 'items.$.quantity': productCount } },
            { new: true })
            .then((response) => res.status(200).json({update: response.acknowledged}))
            .catch((error) => res.status(400).json({update: error.acknowledged}))
    } catch (error) {
        res.status(400).json({error: error.message})
    }
})

cartRoute.post('/promo', verifyToken, async (req, res) => {
    try {
        const promoCode = req.body.promoCode;
        const discount = await Discount.findOne({ name: promoCode });
        if (discount && discount.remainingUses !== 0) {
            res.status(200).json({ message: 'Скидка найдена!', active: true, percentage: discount.percentage, id: discount._id });
        } else {
            res.status(404).json({ message: 'Скидка не найдена.', active: false});
        }
    } catch (error) {
        res.status(400).json({error: error.message})
    }
})

cartRoute.delete('/full-delete', verifyToken, async (req, res) => {
    try {
        const userId = req.userId
        const cartUser = await Cart.findOne({ owner: userId });
        cartUser.items = []
        cartUser.save()
                .then(() => res.status(200).json({delete: true}))
                .catch(() => res.status(400).json({delete: false}))
    } catch (error) {
        res.status(400).json({error: error.message})
    }
})

export default cartRoute