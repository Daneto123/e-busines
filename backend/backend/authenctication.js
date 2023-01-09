const express = require('express');
var routerAuth = express.Router();


const { getUser } = require('./database.js');

// проверяване дали профилът съществува
routerAuth.route('/auth/:username/:password').get((req, res) => {

  let username = req.params.username;
  let password = req.params.password;

  console.log(username);
  console.log(password);

  if (username && password) {
    const results = getUser(username, password)

    results.then(function (result) {
      res.json(result);
      console.log(result);
    });
  }

});

module.exports = routerAuth;
