const mysql = require('mysql')

// използване на enviroment ,за подкарване на различни платформи
let dotenv = require('dotenv');
dotenv.config()

// връзка с база данни
const db = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  connectionLimit: 100,
  multipleStatements: true
})

db.connect();

// вземане на информация за всички телефони
function getAllPhones() {

    return new Promise(function(resolve, reject) {
      db.query("SELECT * FROM phones", function (err, result, fields) {
        if (err) throw err;
        console.log("print");
        resolve(result);
      });

    })

}

// вземане на информация за телефон по зададено име
function getPhoneByName(name) {
  return new Promise(function(resolve, reject) {
  db.query(`
  SELECT * 
  FROM phones
  WHERE name = ?
  `, [name], function (err, result, fields){
    if (err) throw err;
      console.log("db: " + result)
      resolve(result);
    })
  })

}

// вземане на информация за телефон по размери
function getPhoneBySize(width, height, thickness) {
  return new Promise(function(resolve, reject) { 
    db.query(`
    SELECT * 
    FROM phones
    WHERE width = ?
    AND height = ?
    AND thickness = ?
    `, [width, height, thickness], function (err, result, fields){
      if (err) throw err;
        resolve(result);
    })
  })

}

// записване на информация за поръчка на потребител
function saveOrder(id, username, order) {
  return new Promise(function(resolve, reject) { 
    db.query(`
    INSERT INTO orders(id, username, order)
    VALUES (?, ?, ?)
    `, [id, username, order], function (err, result, fields){
      if (err) throw err;
        resolve(result);
    })
  })

}

// вземане на поръчка от базата с данни на конкретен потребител
function getOrder(username) {
  return new Promise(function(resolve, reject) { 
    db.query(`
    SELECT * 
    FROM orders 
    WHERE username = ?`
    , [username], function(err, result, fields) {
      if (err) throw err;
        resolve(result);
    })
  })

}

// промяна на поръчка от базата с данни на конкретен потребител
function changeOrder(id, order1) {
  return new Promise(function(resolve, reject) { 
    console.log("vleze");
    db.query("UPDATE orders SET `order` = JSON_MERGEPATCH(`order`, '" + order1 + "') WHERE username = " + id + ";"
    , function(err, result, fields) {
      if (err) throw err;
        console.log(result);
        resolve(result);
    })
  })

}

// премахване на поръчка на потребител
function removeOrder(id) {
  return new Promise(function(resolve, reject) { 
    db.query(`
    DELETE from orders 
    WHERE id = ?`
    , [id], function(err, result, fields) {
      if (err) throw err;
        resolve(result);
    })
  })

}


// вземане на потребител от база от данни
function getUser(username, password) {
  return new Promise(function(resolve, reject) { 
    db.query(`
    SELECT * 
    FROM accounts 
    WHERE username = ? 
    AND password = ?`
    , [username, password], function(err, result, fields) {
      if (err) throw err;
        resolve(result);
    })
  })

}

// добавяне на нова фирма и продукт която тя предлага
function addPhone(id, name, width, height, thickness, color, company, availability, price, avatar) {
  return new Promise(function(resolve, reject) {  
    db.query(`
    INSERT INTO phones (id, name, width, height, thickness, color, company, availability, price, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, name, width, height, thickness, color, company, availability, price, avatar], function(err, result, fields){
      if (err) throw err;
        console.log(result)
        resolve(result);
    });
  })
  
}

// добавяне на нов потребител
function addNewUser(username, password, email, id, type) {
  return new Promise(function(resolve, reject) {  
    db.query(`
    INSERT INTO accounts (username, password, email, id, type)
    VALUES (?, ?, ?, ?, ?)
    `, [username, password, email, id, type], function(err, result, fields){
      //if (err) throw err;
        console.log(result)
        //resolve(result);
    });
  })
  
}


module.exports = { getAllPhones: getAllPhones, getPhoneByName: getPhoneByName, getPhoneBySize: getPhoneBySize, saveOrder: saveOrder, 
                   getOrder: getOrder, changeOrder: changeOrder, removeOrder: removeOrder, getUser: getUser, addPhone: addPhone, addNewUser: addNewUser  }