require('dotenv').config();
const express = require('express');
const app = express();
const cors = require("cors");

app.use(express.json());
app.use(express.urlencoded({extended: false}))
app.use(cors()); 

const routes = require('./routes/front.route'); 

app.use('', routes);

app.listen(3000, () => console.log('server is running..'));

module.exports = app; //for testing