var config = require("./../config.js");
var dbDetails = config.database;
var mysql = require('mysql');
var pool  = mysql.createPool({
	host     : dbDetails.host,
   	user     : dbDetails.user,
   	password : dbDetails.password,
   	database : dbDetails.database,
   	connectionLimit : 50
   }
);
 
exports.pool = pool;


