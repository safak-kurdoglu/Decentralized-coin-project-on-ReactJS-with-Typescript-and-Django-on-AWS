const jwt = require('jsonwebtoken');
const controller = require('../controllers/front.controller');
const forge = require("node-forge");

function checkMoneyAndLegitimacy(req, res, next) {
    try {
        const transactions = controller.getTransactions();
        const key = req.body.senderKey;
        let approvedAmount = 0;
        let transactionNum = 0;
        transactions.forEach((transaction) => {
            if(transaction.receiver == key)
                approvedAmount += transaction.amount;
            if(transaction.sender == key){
                approvedAmount -= transaction.amount;
                transactionNum++;
            }
        }); 
        let pk = forge.pki.privateKeyFromPem(key);
        let decryptedPassword = forge.util.decodeUtf8(pk.decrypt(req.body.password));
        if(decryptedPassword == ("legit-start-"+transactionNum)){
            if(req.body.amount <= approvedAmount) 
                next();
            else   
                return res.json({status: false, message: "Your amount is not enough."});
        }
        else
            return res.json({status: false, message: "Wrong Transaction number."});

    } catch (error) {   
        return res.json({status: false, data: error}); 
    }
}

module.exports = {
    checkMoneyAndLegitimacy
}