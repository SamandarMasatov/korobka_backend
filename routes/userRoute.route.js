import { Router } from "express";
import bcrypt from "bcryptjs";
import verifyToken from "../validation/verifyToken.js";
import multer from "multer";
dotev.config()
import fs from "fs";
import path from "path";
import jwt from 'jsonwebtoken';
import { generationToken } from '../utils/generationJwt.js'
import dotev from 'dotenv'
import cookieParser from "cookie-parser";
import stripePackage from 'stripe';

import pdfGenerate from "../utils/pdfGenerate.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Email from "../models/Email.js";
import Subscription from "../models/Subscription.js";
import WayPay from "../models/WayPay.js";
import OrderStatus from "../models/OrderStatus.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/avatar");
  },
  filename: function (req, file, cb) {
    const userId = req.userId;
    const fileName = userId + '-' + file.originalname;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });
const userRoute = Router();
const stripe = stripePackage(process.env.SECRET_STRIPE_KEY);

userRoute.get("/:userId", verifyToken, async (req, res) => {
  const userId = req.params.userId;
  await User.findOne({ _id: userId })
    .populate({
      path: "favorite",
      populate: {
        path: "items"
      },
    })
    .populate({
      path: "cart",
      populate: {
        path: "items",
        populate: {
          path: "product",
        },
      },
    })
    .populate({
      path: "email"
    })
    .populate({
      path: "order",
      populate: [
          { path: "items.productId" }, 
          { path: "wayPay" }, 
          { path: "status" }
      ]
    }) 
    .populate("role")
    .then((response) => {
      const favoriteItems = response.favorite?.items || [];
      const cartItems = response.cart?.items || [];
      const userEmail = response.email.email || " ";
      const userOrderItems = response.order;

      const userData = {
          favorite: favoriteItems,
          cart: cartItems,
          user: {
            email: userEmail,
            _id: response._id,
            avatarUser: response.avatarUser,
            role: response.role.role,
            name: response.name,
            surname: response.surname,
            phone: response.phone,
            isActivated: response.isActivated,
            activationLink: response.activationLink
          },
          order: userOrderItems,
      };
      res.status(201).json(userData);
    })
    .catch((error) => console.log(error));
});

userRoute.patch("/upload-image", verifyToken, upload.single("image"), async (req, res) => {
    try {
      const userId = req.userId;
      const url = process.env.API_URL + "/avatar/" + req.file.filename;

      const user = await User.findById(userId);

      if (user) {
        if (user.avatarUser) {
          const avatarPath = `public/avatar/${user.avatarUser}`;
          if (fs.existsSync(avatarPath)) {
            fs.unlinkSync(avatarPath);
          }
        }

        await User.findByIdAndUpdate(
          { _id: userId },
          { avatarUser: url },
          { new: true }
        )
          .then(() => {
            res.status(201).json({
              message: "Фото успешно сохранено",
              url: url,
            });
          })
          .catch((error) =>
            res.status(400).json({ message: "Ошибка сохранения данных" })
          );

      } else {
        res.status(404).json({ message: "Пользователь не найден" });
      }
    } catch (error) {
      res.status(400).json({ error: error });
    }
  }
);

userRoute.patch("/update", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const body = req.body;

    if(body.email) {
      const user = await User.findById(userId).populate("email");

      if(!user) {
        return res.status(400).json({ message: "Ошибка сохранения данных" })
      }

      const emailUser = await Email.findById(user.email._id);
      const subscriptionUser = await Subscription.findOne({email: user.email.email})

      if(!emailUser) {
        return res.status(400).json({ message: "Ошибка сохранения данных" })
      }

      if(subscriptionUser) {
        subscriptionUser.email = body.email
        await subscriptionUser.save()
      }

      emailUser.email = body.email
      await emailUser.save()
      delete body.email
    }

    await User.updateOne({ _id: userId }, body, { new: true })
            .then(() => {
              res.status(200).json({
                message: "Данные успешно сохранены",
              });
            })
            .catch((error) =>
              res.status(400).json({ message: "Ошибка сохранения данных" })
            );
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

userRoute.patch("/:id/password", verifyToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const body = req.body;
    const user = await User.findOne({ _id: userId });

    if (user) {
      const isMatch = await bcrypt.compare(body.prepassword, user.passwordHash);
      if (!isMatch) {
        return res
          .status(400)
          .json({ message: "Старый пароль неверный", resultPass: false });
      } else {
        user.passwordHash = await bcrypt.hash(body.confirmPassword, 12);
        await user.save();
        res.status(201).json({
          message: "Данные успешно сохранены",
          resultPass: true,
        });
      }
    } else {
      res.status(500).json({ error: "Ошибка сервера" });
    }
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

userRoute.post("/order", verifyToken, async (req, res) => {
  const userId = req.userId;
  const body = req.body;

  let newOrder = {
    owner: userId,
    totalAmount: body.totalAmount,
    address: body.order.address,
    wayPay: body.order.wayPay
  }

  newOrder.items = body.cart.map(item => ({
    productId: item._id,
    quantity: item.count
  }))

  const order = new Order(newOrder);
  order.save()
    .then(async (savedOrder) => {
        if (savedOrder) {
            const user = await User.findById(userId);
            if (user) {
                user.order.push(savedOrder._id.toString());
                await user.save();

                const populatedOrder = await Order.findById(savedOrder._id)
                    .populate('items.productId')
                    .populate('status')
                    .populate('wayPay');
        
                pdfGenerate(populatedOrder, order._id)
                          .then((data) => {
                            if(data.result) {
                              res.status(200).json({ message: 'Заказ оформлен', success: true, order: populatedOrder, url: data.url });
                            }
                          })
                          .catch((error) => {
                              res.status(400).json({ message: 'Ошибка формирования чека' });
                          });
            } else {
              res.status(404).json({ message: 'Пользователь не найден' });
            }
        } else {
            res.status(500).json({ message: 'Не удалось сохранить заказ' });
        }
    })
    .catch(err => {
      console.log(err);
        res.status(500).json({ message: 'Произошла ошибка при сохранении заказа', error: err });
    });
  
});

userRoute.delete("/delete-order/:orderId", verifyToken, async (req, res) => {
  const orderId = req.params.orderId
  const userId = req.userId
  try {
    const response = await User.updateOne({ _id: userId }, { $pull: { order: orderId } });
    const responseOrder = await Order.deleteOne({ _id: orderId });
    if(response.acknowledged && responseOrder.acknowledged) {
      res.status(200).json({ message: "Заказ успешно удален", success: true });
    }
    else {
      res.status(400).json({ message: "Ошибка удаления111", success: false });
    }
  } catch (error) {
      res.status(400).json({message: "Ошибка удаления", delete: error.acknowledged });
  }
})

userRoute.get("/order/:orderId/check", verifyToken, async (req, res) => {
  const currentDir = process.cwd();
  const orderId = req.params.orderId;
  const pdfFilePath = path.join(currentDir, '../public', `check-${orderId}.pdf`);

  try {
    if (fs.existsSync(pdfFilePath)) {
      res.status(200).json({ message: "PDF файл уже существует", url: `check-${orderId}.pdf`});
    } else {
      const save = await Order.findById(orderId).populate('items.productId')
      pdfGenerate(save, orderId)
        .then((data) => {
          if(data.result) {
            res.status(200).json({ message: 'Чек сформирован', url: data.url });
          }
        })
        .catch((error) => {
            res.status(400).json({ message: 'Ошибка формирования чека', url: null});
        });
    }
  } catch (error) {
    console.error('Произошла ошибка:', error);
    res.status(400).json({ message: "Ошибка при создании PDF файла", success: false });
  }
})

userRoute.get("/activate/:link", async (req, res) => {
  try {
    const link = req.params.link;
    const user = await User.findOne({activationLink: link});

    if(!user) {
      res.status(400).json({ message: "Некорректная ссылка активации" })
    }

    user.isActivated = true;
    user.activationLink = null;
    await user.save();
  
    res.redirect(process.env.CLIENT_URL + '?message=Аккаунт активирован');
  } catch (error) {
    console.error('Произошла ошибка:', error);
    res.status(400).json({ message: "Ошибка при активации" });
  }
})

userRoute.get("/token/refresh", async (req, res) => {
  try {
    const refresh_token = req.cookies.refreshToken;

    if (!refresh_token) {
      return res.status(401).json({ message: "Не авторизованный пользователь", redirectTo: "/api/auth/login" });
    }

    try {
      const userData = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
      const user = await User.findById(userData.id).populate("role");

      const tokens = generationToken({id: user._id, role: user.role.role})

      res.cookie("refreshToken", tokens.refreshToken, {maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'None', secure: true})
      res.cookie("accessToken", tokens.accessToken, {maxAge: 7 * 24 * 60 * 60 * 1000, httpOnly: true, sameSite: 'None', secure: true})
      
      res.status(200).json({
          id: user._id, 
          role: user.role.role
      });

    } catch (error) {
      res.cookie("refreshToken", "", { expires: new Date(0), httpOnly: true, sameSite: 'None', secure: true });
      res.cookie("accessToken", "", { expires: new Date(0), httpOnly: true, sameSite: 'None', secure: true });
      return res.status(422).json({ message: 'Ошибка при проверке refresh токена', redirectTo: "/api/auth/login" });
    }
  } catch (error) {
    return res.status(500).json({ message: 'Что-то пошло не так' });
  }
});

userRoute.post("/pay/checkout", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: req.body.items.map(item => {
        return {
          price_data: {
            currency: "byn",
            product_data: {
              name: item.name,
            },
            unit_amount: (item.price)*100,
          },
          quantity: item.count
        }
      }),
      success_url: "http://localhost:5173/cart/order?payment_success=true",
      cancel_url: "http://localhost:5173/cart/order",
    })

    res.json({
      url: session.url
    })
  } catch (error) {
    res.status(500).json({error: error.message})
  }
})

export default userRoute;
