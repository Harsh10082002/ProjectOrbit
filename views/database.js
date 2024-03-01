const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',     // Your MySQL server host
    user: 'root',  // Your MySQL username
    password: '@harsh10082002',  // Your MySQL password
    database: 'projectm'   // Your MySQL database name
});

module.exports = connection;