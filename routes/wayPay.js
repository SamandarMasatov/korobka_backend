import {Router} from 'express'
import Category from '../models/Category.js'
import WayPay from '../models/WayPay.js';

  
const wayPay = Router();
  
wayPay.get('/all', async (req, res) => {
  try {
    const allWayPay = await WayPay.find();
    res.status(202).json(allWayPay)
  } catch (error) {
    res.status(500).json({
      message: "Не удалось доcтать способы оплаты"
    });
  }
});

export default wayPay