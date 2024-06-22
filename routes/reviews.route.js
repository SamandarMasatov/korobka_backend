import {Router} from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwtToken from 'jsonwebtoken'
import { registerValidation, loginValidation } from '../validation/auth.js'
import verifyToken from '../validation/verifyToken.js'
import multer from 'multer'
import moment from 'moment'
import { fakerRU as faker } from '@faker-js/faker'
import axios from 'axios'
import crypto from 'crypto'
import path from 'path'
import iconv from 'iconv-lite'

import Review from '../models/Review.js'
import User from '../models/User.js'
import Comment from '../models/Comment.js'

moment.locale('ru');

const reviewsRoute = Router()
var slider = []

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "public/review");
    },
    filename: function (req, file, cb) {
        crypto.pseudoRandomBytes(16, function (err, raw) {
            const encodedFilename = iconv.encode(raw.toString('hex') + Date.now() + path.extname(file.originalname), 'win1251');
            const filename = encodedFilename.toString();
            cb(null, filename);
            slider.push(`http://localhost:5000/review/${filename}`);
        });
    }
});

const upload = multer({ storage: storage });

function modifiedReaviews(obj) {
    return obj.map(obj => ({
        ...obj._doc,
        date: moment(obj.date).format('LL')
    }));
}

// reviewsRoute.get('/', verifyToken, async (req, res) => {
//     // const userId = req.params.userId
//     // await User.findOne({_id: userId})
//     //     .then(item => {
//     //         res.status(201).json({
//     //             name: item.name,
//     //             surname: item.surname,
//     //             email: item.email,
//     //             phone: item.phone,
//     //             status: item.status,
//     //             avatarUser: item.avatarUser
//     //         })
//     //     })
//     //     .catch(error => res.status(400).json({error: error}))
// })


reviewsRoute.get('/best', async (req, res) => {
    try {
        const bestReviews = await Review.find({stars: 5}).limit(5).select('owner text stars date likes').populate('owner');
        const gender = faker.person.sex();
        let item = 0;
        const randomPage = Math.floor(Math.random() * 30) + 1;
        const response = await axios.get(
            `https://api.pexels.com/v1/search?query=live+${gender}&per_page=10&page=${randomPage}`,
            { headers: { Authorization: process.env.AUTH_PIXELS  } }
          );
        const photos = response.data.photos;
        const arrPhotos = []

        photos.forEach(photo => {
            arrPhotos.push(photo.src.tiny);
        })

        bestReviews.forEach(async (review) => {
            if(review.owner == null) {
                const owner = {
                    name: faker.person.firstName(gender),
                    surname: faker.person.lastName(gender),
                    avatarUser: arrPhotos[item]
                }
                review.owner = owner
                item++
            }
        })

        const modifiedData = modifiedReaviews(bestReviews)
        res.json(modifiedData);

    } catch (error) {
        console.log(error.message);
    }
})

reviewsRoute.get('/:id', async (req, res) => {
    try {
        const reviewsProduct = await Review.find({product: req.params.id}).populate('owner comments');

        const filteredReviews = reviewsProduct.filter(review => review.owner !== null);

        const modifiedData = modifiedReaviews(filteredReviews)

        res.status(200).json(modifiedData);

    } catch (error) {
        console.log(error.message)
    }
})

reviewsRoute.post('/create/new-review', verifyToken, upload.array('image'), async (req, res) => {
    try {

        const infoReview = {
            ...req.body,
            slider: slider
        }
        const newReview = new Review(infoReview);
        newReview.save()
                .then((savedReview) => {
                    res.status(201).json({ message: 'Отзыв успешно создан', create: true})
                })
                .catch((error) => {
                    res.status(400).json({message: 'Ошибка создания отзыва', create: false})
                });

    } catch (error) {
        console.log(error.message)
    }
})

reviewsRoute.post('/like-review/:reviewId', verifyToken, async (req, res) => {
    const userId = req.userId;
    const reviewId = req.params.reviewId
    
    try {
        
        const review = await Review.findById(reviewId);

        if(review.likes.includes(userId)) {
                let length = review.likes.length
                review.likes = review.likes.filter(id => id.toString() !== userId);
                await review.save();
                return res.status(200).json({liked: false, like: review.likes.length, message: 'Успешно убрана оценка "Нравится"'})
        }

        review.likes.push(userId);
        await review.save();

        return res.status(200).json({liked: true, like: review.likes.length, message: 'Успешно поставлена оценка "Нравится"'})


    } catch (error) {
        console.log(error.message);
        res.status(500).json({message: "Ошибка"})
    }
})

export default reviewsRoute