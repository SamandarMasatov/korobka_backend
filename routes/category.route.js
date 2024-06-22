import {Router} from 'express'
import Category from '../models/Category.js'

  
const category = Router();
  
category.get('/all', async (req, res) => {
  try {
    const allCategories = await Category.find();
    res.status(202).json({
        categories: allCategories
    })
  } catch (error) {
    res.status(500).json({
      message: "Не удалось доcтать категории"
    });
  }
});




export default category