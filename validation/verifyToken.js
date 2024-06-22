
import jwt from 'jsonwebtoken';
import dotev from 'dotenv'
dotev.config()

const verifyToken = (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(422).json({ message: 'Не авторизован', redirectTo: "/api/auth/login" });
  }

  try {
    const verifiedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.userId = verifiedToken.id;
    next();
  } catch (error) { 
    return res.status(401).json({ message: 'Ошибка токена' });
  }
  
};

export default verifyToken