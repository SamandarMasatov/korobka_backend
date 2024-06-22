import {Router} from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import jwtToken from 'jsonwebtoken'
import * as uuid  from 'uuid';
import dotev from 'dotenv'
dotev.config()

import User from '../models/User.js'
import Email from '../models/Email.js'
import Role from '../models/Role.js';
import { validationResult } from 'express-validator'
import { registerValidation, loginValidation } from './../validation/auth.js'
import { generationToken } from '../utils/generationJwt.js'
import { sendActivationLink, sendResetPassLink } from '../utils/mailer.js'

const auth = Router()

auth.post('/registration', registerValidation, async (req, res) => {
    try {
        const errors = validationResult(req)
        const { name, email, surname, password} = req.body

        if(!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: "Некорректные данные при регистрации",
            })
        }

        const isEmail = await Email.findOne({email})

        if(isEmail) {
            return res.status(402).json({message: "Такой email уже существует"})
        } else {

            const passwordHash = await bcrypt.hash(password, 12)
            const activationLink = uuid.v4()
            const newEmail = await Email.create({email: email})
            await User.create(
                {
                    name,
                    email: newEmail._id,
                    surname,
                    passwordHash: passwordHash,
                    activationLink
                }
            )

            sendActivationLink(email, `${process.env.API_URL}/api/profile/activate/${activationLink}`)
            res.status(200).json({message: "Пользователь успешно создан"});
        }

    } catch (error) {
        console.log(error.message)
    }
})

auth.post('/login', loginValidation, async (req, res) => {
    try {
        const errors = validationResult(req)
        if(!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: "Не корректные данные при авторизации",
            })
        }

        const { email, password } = req.body
        const isEmail = await Email.findOne({email})

        if(!isEmail) {
            return res.status(400).json({message: "Такого email не существует"})
        }

        const user = await User.findOne({email: isEmail._id}).populate("role").populate("email")
        const isMatch = await bcrypt.compare(password, user.passwordHash)

        if(!isMatch) {
            return res.status(400).json({message: "Ошибка авторизации"})
        }

        const tokens = generationToken({id: user._id, role: user.role.role})

        res.cookie("refreshToken", tokens.refreshToken, {maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'None', secure: true })
        res.cookie("accessToken", tokens.accessToken, {maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'None', secure: true})
        
        res.status(200).json({
            id: user._id, 
            role: user.role.role
        });

    } catch (error) {
        console.log(error)
    }
})

auth.get('/admin/:userId', async (req, res) => {
    try {
        const response = req.params.userId
        
        await User.findOne({_id: response})
                  .then((user) => {
                    if(user.role == 1) {
                        res.status(200).json({message: true})
                    } else {
                        res.status(400).json({message: "Вы не админ"})
                    }
                  })
                  .catch((error) => {
                    console.log(error)
                  })
    } catch (error) {
        console.log(error)
    }
})

auth.post('/reset-password-request', async (req, res) => {
    const email = req.body.email
    const user = await Email.findOne({email: email})

    if(!email) {
        return res.redirect(process.env.CLIENT_URL + `/api/auth/reset-password/${token}`);
    }

    if(user) {
        const secret = jwtToken.sign({email: email, id: user.id}, process.env.JWT_RESET_SECRET, {expiresIn: '5m'})
        const link = `${process.env.API_URL}/api/auth/reset-password/${secret}`
        sendResetPassLink(email, link)
        res.status(201).json({message:"Сообщение отправлено на почту"})
    } else {
        res.status(400).json({message:"Такого e-mail не существует"})
    }
})

auth.get('/reset-password/:token', async (req, res) => {
    const { token } = req.params

    if(!token) {
        return res.redirect(process.env.CLIENT_URL + `/api/auth/login`);
    }

    try {
        const verify = jwtToken.verify(token, process.env.JWT_RESET_SECRET)
        const user = await User.findById(verify.id)

        if(!user) {
            return res.status(400).json({message:"Пользователь не найден"})
        }

        res.redirect(process.env.CLIENT_URL + `/api/auth/reset-password/${token}`);
    } catch (error) {
        res.status(400).json({message:"Ошибка сброса пароля"})
    }
})

auth.post('/reset-password/:token', async (req, res) => {
    const token = req.params.token
    const password = req.body.password

    if(!token) {
        res.redirect(process.env.CLIENT_URL + '/api/auth/login');
    }
    
    try {
        const verify = jwtToken.verify(token, process.env.JWT_RESET_SECRET)
        const user = await User.findById(verify.id)
    
        if(!user) {
            return res.status(400).json({message:"Пользователь не найден"})
        }
        user.passwordHash = await bcrypt.hash(password, 12)
        await user.save()

        res.status(201).json({message:"Пароль успешно обновлен"})
    } catch (error) {
        console.log(error);
        res.status(400).json({message:"Ошибка сброса пароля"})
    }
})

export default auth