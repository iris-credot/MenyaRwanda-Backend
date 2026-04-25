const express = require('express');
const router = express.Router();

const auth = require('../Middleware/authentication');
const userController = require('../Controllers/user');
const loginController = require('../Controllers/login');

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// AUTH
router.post('/signup', upload.single('image'), userController.createUser);
router.post('/login', loginController.login_post);
router.post('/logout', loginController.logout);

// PASSWORD & AUTH FLOW
router.post('/forgot', userController.ForgotPassword);
router.post('/verify-otp', userController.OTP);
router.post('/reset-password/:token', userController.ResetPassword);

// USER
router.get('/', auth.adminJWT, userController.getAllUsers);
router.get('/users', auth.adminJWT, userController.getAllUserRole);
router.get('/:id', auth.AuthJWT, userController.getUserById);
router.put('/:id', auth.AuthJWT, upload.single('image'), userController.updateUser);
router.put('/password/update', auth.AuthJWT, userController.updatePassword);
router.delete('/:id', auth.BothJWT, userController.deleteUser);

module.exports = router;