const route = require('express').Router();
const front_controller = require('../controllers/front.controller');
const middleware = require('../middlewares/middleware');

route.post('/become-node', front_controller.becomeNode);
route.post('/register-new-node', front_controller.registerNewNode);
route.get('/check-node-status', front_controller.checkNodeStatus);
route.post('/new-wallet', front_controller.newWallet);
route.post('/register-new-wallet', front_controller.registerNewWallet);
route.post('/wallet-login', front_controller.walletLogin);
route.post('/transfer', middleware.checkMoneyAndLegitimacy, front_controller.transfer);
route.post('/transaction-start', front_controller.transactionStart);
route.put('/transaction-approve', front_controller.transactionApprove);
route.get('/check-connection', front_controller.checkConnection);

module.exports = route;      