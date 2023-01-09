const express = require('express');
var routerUser = express.Router();

const { addNewUser } =  require('./database.js');

const Uuid = require('uuid');

routerUser.route('/r').post((req, res, next) => {
  const email = req.body.email;

  const emailRegex = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;

  if(email.match(emailRegex)){
    next();
  }   

}, (req, res) => {

  let id = Uuid.v4();
  let username = req.body.username;
  let password = req.body.password;
  let repassword = req.body.repassword;
  let email = req.body.email;
  let type = req.body.type;

  if (!username || !password || !email || !type || !(password == repassword)) {
    return res.status(400).json({ error: "Invalid parameter" });
  }

  console.log(id);
  console.log(username);
  console.log(password);
  console.log(repassword);
  console.log(email);
  console.log(type);


  const newUser = addNewUser(username, password, email, id, type);
  newUser.then(function (result) {
    console.log(result)
    return res.json(result)
  })

});

module.exports = routerUser;
