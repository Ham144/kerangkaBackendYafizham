const router = require('express').Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');

router.post('/register', userController.register);
router.post('/login', loginLimiter, userController.login);
router.post('/refresh', userController.refresh);
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);

module.exports = router; 