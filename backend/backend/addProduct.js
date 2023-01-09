const express = require('express');
var routerProduct = express.Router();
let multer = require('multer');

const Uuid = require('uuid');

const { addPhone } = require('./database.js')

// настроики на multer
var storage = multer.diskStorage({
	destination: function(req, file, callback) {
		callback(null, '../images/upload/');
	},
	filename: function(req, file, callback) {
		callback(null, file.originalname);
	}

});

var upload = multer({ storage: storage });

// добавяне на нова обява
routerProduct.route("/addPhones").post(upload.single('uploaded_file'), (req, res) => {
  const id = Uuid.v4();
  const name = req.body.PhoneModel
  const width = req.body.Width
  const height = req.body.Height
  const thickness = req.body.Thickness
  const color = req.body.Color
  //const color = "white"
  const company = req.body.CompanyName
  const availability = req.body.Availability
  const price = req.body.Price
  let avatar

  if(!req.file) {
    avatar = "unknown-case-icon.jpg"
  } else {
    avatar = req.file.filename;
  }

  console.log(name);
  console.log(width);
  console.log(height);
  console.log(thickness);
  console.log(color);
  console.log(company);
  console.log(availability);
  console.log(price);

  if (!name || !height || !width || !thickness || !color || !company || !availability || !price || !avatar) {
    return res.status(400).json({ error: "Invalid parameter" });
  }

  const phoneNew = addPhone(id, name, width, height, thickness, color, company, availability, price, avatar)
  phoneNew.then(function (result) {
    console.log(result);
    return res.json(result)
  })
})


module.exports = routerProduct;
