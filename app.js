import dotev from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cors from 'cors';
import bodyParser from 'body-parser';
import auth from './routes/auth.route.js';
import productRoute from './routes/product.route.js';
import cartRoute from './routes/cart.route.js';
import favoriteRoute from './routes/favorite.route.js';
import emailRoute from './routes/email.route.js';
import userRoute from './routes/userRoute.route.js';
import reviewsRoute from './routes/reviews.route.js';
import adminRoute from './routes/admin.route.js';
import category from './routes/category.route.js';
import cookieParser from 'cookie-parser';
import wayPay from './routes/wayPay.js';
import { limiter } from './utils/limiter.js';

dotev.config();
const app = express();
const PORT = process.env.PORT || 5000;

// app.use(limiter)
app.use(morgan('combined'));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.static('public'));
// app.use(cors({
//     credentials: true,
//     origin: process.env.CLIENT_URL
// }))
app.use(
  cors({
    credentials: true,
    origin: '*',
  })
);
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
app.use('/api/auth', auth);
app.use('/api/products', productRoute);
app.use('/api/cart', cartRoute);
app.use('/api/favorite', favoriteRoute);
app.use('/api/email', emailRoute);
app.use('/api/profile', userRoute);
app.use('/api/reviews', reviewsRoute);
app.use('/api/admin', adminRoute);
app.use('/api/category', category);
app.use('/api/way-pay', wayPay);

async function start() {
  try {
    await mongoose
      .connect(process.env.DB_URL)
      .then(() => {
        console.log('Вы подключились к базе');
      })
      .catch(() => {
        console.log('Произошла ошибка подключения');
      });

    app.listen(PORT, () => {
      console.log('Сервер запущен на порту: ' + PORT);
    });
  } catch (error) {
    console.log('Произошла ошибка: ' + error);
  }
}

start();
