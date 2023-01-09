const express = require('express');
var routerSearch = express.Router();

const { getPhoneByName, getPhoneBySize } = require('./database');

// търсене на телефон по име
routerSearch.route("/phonesByName/:name").get((req, res) => {
  let name = req.params.name;

  if (!name) {
    return res.status(400).json({ error: "Invalid parameter" });
  }

  const phoneByName = getPhoneByName(name)
  phoneByName.then(function (result) {
    console.log(result)
    return res.json(result)
  })
})

// търсене на телефон по размери
routerSearch.route("/phonesBySize/:height/:width/:thickness").get((req, res) => {
  let height = req.params.height;
  let width = req.params.width;
  let thickness = req.params.thickness;

  if (!height || !width || !thickness) {
    return res.status(400).json({ error: "Invalid parameter" });
  }

  const phoneBySize = getPhoneBySize(height, width, thickness)
  phoneBySize.then(function (result) {
    return res.json(result)
  })

})


module.exports = routerSearch;
