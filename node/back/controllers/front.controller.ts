import { truncate } from "fs/promises";

const axios = require('axios');
const rp = require('request-promise');
const nForge = require("node-forge");

let nodes: {uri: string, x: number, y: number}[] = [];
let transactions: {sender: string, receiver: string, amount: number}[] = [];
let myUserName: string = "";
let pendingTransactions: {sender: string, receiver: string, amount: number}[] = [];

function getTransactions(){
    return transactions;
}
 
async function becomeNode(req: any, res: any){
    try {
        const IpResp = await axios("https://checkip.amazonaws.com/");
        const myUri: string = "http://" + IpResp.data.trim() +":"+ req.socket.server._connectionKey.substring(req.socket.server._connectionKey.length-4);
        myUserName = req.body.username;
        axios.post("yourhost/new-node",{
            uri: myUri,
            x: req.body.x,
            y: req.body.y,
        }).then((resp) => {  
            if(resp.data.status){
                const nodesModel = JSON.parse(resp.data.nodes); 
                nodesModel.forEach((nodeModel) => {
                    const node: {uri: string, x: number, y: number} = {uri: nodeModel.pk, x:nodeModel.fields.x, y: nodeModel.fields.y}
                    nodes.push(node);
                });
                if(nodes.length){ 
                    const myNode: {uri: string, x: number, y: number} = {uri: myUri, x: req.body.x, y: req.body.y}
                    const regNodePromises = []; 
                    nodes.forEach(node => {
                        const requestOptions = {
                            uri: node.uri + '/register-new-node', 
                            method: 'POST',
                            body: { newNode: myNode },
                            json: true
                        };
                        regNodePromises.push(rp(requestOptions));
                    });
                
                    Promise.allSettled(regNodePromises).then((responds: any) => {
                        //register max length transactions.
                        let transactionsLen = 0;
                        responds.forEach((resp) => {
                            if(!(resp.status == "rejected") && transactionsLen < resp.value.transactions.length){
                                transactions = resp.value.transactions;
                                transactionsLen = transactions.length; 
                            }
                        });
                    });
                }
                res.json({status: true}); 
            }
            else{
                res.json({status: false, message: resp.data.message});
            }
        }).
        catch((error: any) =>{
          res.status(500).json({status: false, message: error.response.data});
        });
    } 
    catch(error: any){  
        res.status(500).json({status: false, message: error.message});
    }
}

//Register new node and send transactions
async function registerNewNode(req: any, res: any){
    nodes.push(req.body.newNode);

    res.json({transactions});
}

async function checkNodeStatus(req: any, res: any){
    const IpResp = await axios("https://checkip.amazonaws.com/");
    const myUri: string = "http://" + IpResp.data.trim() +":"+ req.socket.server._connectionKey.substring(req.socket.server._connectionKey.length-4);
    axios.post("yourhost/check-connection",{
        uri: myUri
    })
    .then((resp) => {
        if(resp.data.status)
            res.json({status: true});
        else
            res.json({status: false, message: resp.data.message});
    });
}

async function newWallet(req: any, res: any){
    try {
        //save new wallet as a empty transaction.
        transactions.push({sender: "", receiver: req.body.key, amount: 100});
        const regNodePromises = [];
        nodes.forEach(node => {
            const requestOptions = {
                uri: node.uri + '/register-new-wallet', 
                method: 'POST', 
                body: { key: req.body.key },  
                json: true
            };
            regNodePromises.push(rp(requestOptions));
        });
         
        Promise.allSettled(regNodePromises).then(() => {
            res.send();  
        });
    }  
    catch(error: any){  
        res.status(500).json({status: false, message: error.message});
    }
}

async function registerNewWallet(req: any, res: any){
    transactions.push({sender: "", receiver: req.body.key, amount: 100});

    res.send();
}

async function walletLogin(req: any, res: any){
    try {
        const key = req.body.key;
        let isWalletExist = false;
        let amount = 0;
        transactions.forEach((transaction) => {
            if(transaction.receiver == key){
                isWalletExist = true;   
                amount += transaction.amount;
            }if(transaction.sender == key){
                amount -= transaction.amount;
            }
        });
        if(isWalletExist)
            res.json({status: true, amount});
        else   
            res.json({status: false})
    } 
    catch(error: any){  
        res.status(500).json({status: false, message: error.message});
    }
}

async function transfer(req: any, res: any){
    try { 
        const transaction: {sender: string, receiver: string, amount: number} = {
            sender: req.body.senderKey,
            receiver: req.body.receiverKey,
            amount: parseFloat(req.body.amount)
        }

        const resp = await axios.post("yourhost/get-wallet-key",{
            username: myUserName
        });
        const key = resp.data.key;

        const regNodePromises = [];
        nodes.forEach(node => {
            const requestOptions = {
                uri: node.uri + '/transaction-start', 
                method: 'POST', 
                body: { transaction: transaction,
                        nodeKey: key},
                json: true
            };
            regNodePromises.push(rp(requestOptions));
        });
         
        Promise.allSettled(regNodePromises).then(() => {
            pendingTransactions.push(transaction);
            pendingTransactions.push({
                sender: "",
                receiver: key,
                amount: 1
            })
            res.json({status: true, nodeKey: key});   
        });
    } 
    catch(error: any){  
        res.status(500).json({status: false, message: error.message});
    }
}

async function transactionStart(req: any, res: any){
    pendingTransactions.push(req.body.transaction);
    pendingTransactions.push({
        sender: "",
        receiver: req.body.nodeKey, 
        amount: 1
    })

    res.send();
}

async function transactionApprove(req: any, res: any){
    const transaction = pendingTransactions.find((transaction) => {
        if(transaction.sender == req.body.sender && transaction.receiver == req.body.receiver && transaction.amount == parseFloat(req.body.amount))
            return true;
    });
        
    let pk = nForge.pki.privateKeyFromPem(transaction.sender);
    let decryptedPassword = nForge.util.decodeUtf8(pk.decrypt(req.body.password));
    if(transaction && decryptedPassword == "legit-approve"){
        let prize = pendingTransactions.find((transaction) => {
            if(transaction.sender == "" && transaction.receiver == req.body.nodeKey && transaction.amount == 1)
                return true;
        });
        transactions.push(transaction);
        transactions.push(prize);
    }
    res.send()
}

async function checkConnection(req: any, res: any){
    
    res.json({status:true});
}

module.exports = {
    becomeNode,
    registerNewNode,
    checkNodeStatus,
    newWallet,
    registerNewWallet,
    walletLogin,
    transfer,
    transactionStart,
    transactionApprove,
    getTransactions,
    checkConnection
}
