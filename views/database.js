const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',    
    user: 'root',  
    password: 'password_of_MYSQL',  
    database: 'projectm'  
});

module.exports = connection;