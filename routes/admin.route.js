import {Router} from 'express'
import multer from 'multer'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwtToken from 'jsonwebtoken'
import verifyToken from '../validation/verifyToken.js'
import { registerValidation, loginValidation } from './../validation/auth.js'
import iconv from 'iconv-lite'
import path from 'path'
import crypto from 'crypto'

import Product from '../models/Product.js'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "public/product");
    },
    filename: function (req, file, cb) {
      crypto.pseudoRandomBytes(16, function (err, raw) {
          const encodedFilename = iconv.encode(raw.toString('hex') + Date.now() + path.extname(file.originalname), 'win1251');
          const filename = encodedFilename.toString();
          cb(null, filename);
          slider.push(`http://localhost:5000/product/${filename}`);
      });
  }
});

const slider = [];
const upload = multer({ storage: storage });
const adminRoute = Router();
  
adminRoute.post('/add', verifyToken, upload.any(), async (req, res) => {
  try {

    const box = {
      img: slider[0],
      slider: slider.slice(1),
      ...req.body
    }

    const newBox = new Product(box);
    newBox.save();

    res.status(202).json({
        message: "Товар успешно добавлен"
    })

  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Не удалось добавить товар. Пожалуйста, попробуйте еще раз."
    });
  }
});

adminRoute.delete('/delete/:id', verifyToken, async (req, res) => {
  try {
    const id = req.params.id;
    const deleteProduct = await Product.findByIdAndDelete(id)

    if(deleteProduct) {
      res.status(202).json({
        message: "Товар успешно удален из БД"
      })
    } else {
      res.status(500).json({
        message: "Не удалось удалить товар"
      })
    }

  } catch (error) {
    res.status(500).json({
      message: "Не удалось удалить товар из БД"
    });
  }
});


export default adminRoute