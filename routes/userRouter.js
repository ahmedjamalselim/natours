const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController.js');

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgetpassword', authController.forgetPassword);
router.patch('/resetpassword/:token', authController.resetPassword);
router.patch(
  '/updatepassword',
  authController.protect,
  authController.updatePassword
);

router.get(
  '/me',
  authController.protect,
  userController.getMe,
  userController.getUser
);
router.patch(
  '/updateme',
  authController.protect,
  userController.uploadUserPhoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete('/deleteme', authController.protect, userController.deleteMe);

router.use(
  authController.protect,
  authController.restrictTo('admin', 'lead-guid')
);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
