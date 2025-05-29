const User = require('../models/User');

module.exports = async function requireLogin(req, res, next) {
  if (req.session && req.session.userId) {
    try {
      const user = await User.findById(req.session.userId).lean();
      if (!user) {
        return res.redirect('/login');
      }
      req.user = user;
      res.locals.user = user;  // Así el usuario estará disponible en todas las vistas
      return next();
    } catch (error) {
      console.error(error);
      return res.redirect('/login');
    }
  } else {
    res.redirect('/login');
  }
};