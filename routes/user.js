const express = require('express');
const router = express.Router();
const User = require('../models/user.js');
const qrapAsync = require('../utils/wrapAsync.js');
const passport = require('passport');
const { saveReturnTo } = require('../middleware.js');
const userController = require('../controllers/user.js');
const wrapAsync = require('../utils/wrapAsync.js');

router.route("/signup")
.get(userController.renderSignupForm)
.post(wrapAsync(userController.signup));

router.route("/login")
.get(userController.renderLoginForm)
.post(saveReturnTo, passport.authenticate('local', {
  failureRedirect: '/login',
  failureFlash: true,
}), wrapAsync(userController.login));

router.get('/logout', userController.logout);

// router.get('/signup', userController.renderSignupForm);
// router.post('/signup',wrapAsync(userController.signup));

// router.get('/login', userController.renderLoginForm);
// router.post('/login', saveReturnTo, passport.authenticate('local', {
//   failureRedirect: '/login',
//   failureFlash: true,
// }), wrapAsync(userController.login));

module.exports = router;