const express = require('express');
var routerItem = express.Router();

const { getOrder, saveOrder, changeOrder, removeOrder } = require('./database.js')

// създаване на потръчна на потребител
routerItem.route("/addOrder").post((req, res) => {
  const id = Uuidv4;
  const username = req.body.username;
  let order = { };
	  
  const newOrder = saveOrder(id, username, order)
  newOrder.then(function (result) {
    return res.json(result)
  })	
});

// създаване на потръчна на потребител
routerItem.route("/getOrder/:username").get((req, res) => {
  const username = req.params.username;
	  
  const get1 = getOrder(username)
  get1.then(function (result) {
    console.log(result.order)
    return res.json(result)
  })	
});

// добавяне и премахване на предмети от потръчката на потребител
routerItem.route("/changeOrder").post((req, res) => {
  const id = req.body.id;
  let order = req.body.order;

  console.log("backend vliza")
	  
  const changeOrder1 = changeOrder(id, order)
  changeOrder1.then(function (result) {
    console.log("change order" + result)
    return res.json(result)
  })	
});

// премахване на потръчка на потребител
routerItem.route("/removeOrder").post((req, res) => {
  const id = req.body.id;
	  
  const removeOrder1 = removeOrder(id)
  removeOrder1.then(function (result) {
    return res.json(result)
  })	
});

module.exports = routerItem;
