const express = require('express');
const path = require('path');
const session = require('express-session');
const bodyParser = require('body-parser');
const fileURLToPath = require('url');
const cors = require('cors');
const dotenv = require('dotenv');
const { format } = require('path');

const app = express()

app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.urlencoded());
app.use(express.static(path.join(__dirname, 'public')));

 const { getAllPhones } = require('./backend/database');

dotenv.config();
const port = process.env.PORT;

app.use(session({
  name: "session-id",
  secret: "GFGEnter", // Secret key, 
  saveUninitialized: true,
  resave: true,
}))

var corsOptions = {
  origin: "http://localhost:4200"
};

app.use(cors(corsOptions));

// разпределяне на пътищата
app.use('/product', express.static(path.join(__dirname, '/images/upload')));
app.use('/product', require('./backend/addProduct.js'));
app.use('/user', require('./backend/addUser.js'));
app.use('/request', require('./backend/makeReq.js'));
app.use('/search', require('./backend/searchProduct.js'));
app.use('/buy', require('./backend/buyItem.js'));
app.use('/authentication', require('./backend/authenctication.js'));

// зареждане на началната страница
app.get("/", (req, res) => {

  res.send({message: good})
})

// показване на всички телефони
app.get("/phones", (req, res) => {
  const phones = getAllPhones()

  if (!phones || phones.length == 0) {
    return res.status(400).json({ error: "Invalid parameter" });
  }

  phones.then(function (result) {
    //console.log(result)
    return res.json(result)
  })

})

// ако се опита да се достъпи невалиден линк
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send('Page not found')
})

// стартиране на сървъра
// app.listen(port, () => {
app.listen(5200, () => {
  console.log('Server is running on port 5200')
})

// module.exports = app;
