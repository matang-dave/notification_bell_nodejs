var poolModule = require('./mysql_pool.js');
var validator = require('validator');

function getRandomPic(){
	var pics = [
	"1_greg.jpg",
	"2_2.jpg",
	"3_3.jpg",
	"4_4.jpg"
	];
	return pics[Math.floor(Math.random() * pics.length)];
}

function addUser(userObj, callback){
	var name = userObj.name,
	email = userObj.email && userObj.email.toLowerCase(),
	password=userObj.password,
	pic = getRandomPic();

	var retObj = { 
		success:false,
		err_code: ""
	};

	if(name && email) {

		if (!validator.isEmail(email)) {
			retObj.err_code = "Invalid Email address";
			callback(retObj);
			return;
		}

		isEmailAlreadyPresent(email, function (callbackRetobj) {

			if (callbackRetobj.isPresent) {
				retObj.err_code = "User already present";
				callback(retObj);
				return;
			}
			poolModule.pool.getConnection(function (err, connection) {
				if (err) {
					retObj.err_code = err.code;
					callback(retObj);
					connection.release();
					return;
				}


				var query = 'Insert into user(email, password, user_name,pic) values (?,?,?,?)';
				var values = [email, password, name, pic];

				connection.query(query, values, function (err, rows) {
					if (err) {
						retObj.err_code = err.code;
						callback(retObj);

					} else {
						retObj.success = true;

						getUserDetails(rows.insertId, function(retGetUserObj){
							retObj.userData = retGetUserObj.userData;
							callback(retObj);
						});
					}
					connection.release();

				});
			});
		});
	}else{
		retObj.err_code = "Name or email cannot be kept blank";
		callback(retObj);
	}
}

function loginUser(email, password, callback){
	var retObj = {
		isPresent:false
	};

	if(!validator.isEmail(email)){
		retObj.err_code = "Invalid Email address";
		callback(retObj);
		return;
	}
	poolModule.pool.getConnection(function(err, connection) {
		if(err){
			callback(retObj);
			retObj.err_code = err.code;
			connection.release();
			return;
		}

		var query =  'SELECT * from user where email = ? and password = ?';
		var values = [email, password];
		connection.query( query, values,function(err, rows) {
			if(err){
				retObj.err_code = err.code;
				callback(retObj);

			}else{
				if(rows.length>0){
					retObj.isPresent = true;
					retObj.userData = rows[0];
					retObj.userData.pic = getUserImagePathPrefix() + retObj.userData.pic;
				}else{
					retObj.err_code = "Incorrect email or password";
				}
				callback(retObj);
			}
			connection.release();

		});
	});
}


function isEmailAlreadyPresent(email, callback){
	var retObj = {
		isPresent:false
	};
	poolModule.pool.getConnection(function(err, connection) {
		if(err){
			callback(retObj);
			connection.release();
			return;
		}

		var query =  'SELECT id from user where email = ?';
		var values = [email];
		connection.query( query, values,function(err, rows) {
			if(err){
				callback(retObj);

			}else{
				if(rows.length>0){
					retObj.isPresent = true;
					retObj.id = rows[0].id;
				}
				callback(retObj);
			}
			connection.release();

		});
	});
}

function getUserDetails(userId, callback){
	var retObj = {
		success:false,
		err_code: ""
	};

	poolModule.pool.getConnection(function(err, connection) {
		if(err){
			retObj.err_code = err.code;
			callback(retObj);
			connection.release();
			return;
		}

		var query =  'SELECT * from user where id = ?';
		var values = [userId];
		connection.query( query,values, function(err, rows) {
			if(err){
				retObj.err_code = err.code;
				callback(retObj);

			}else{
				if(rows.length>0){
					retObj.success = true;
					retObj.userData = rows[0];

					retObj.userData.pic = getUserImagePathPrefix() + retObj.userData.pic;
				}else{
					retObj.err_code = "User not present";
				}
				callback(retObj);
			}
			connection.release();

		});
	});
}


function getUserIds(callback){
	var userIds = [];
	poolModule.pool.getConnection(function(err, connection) {
		if(err){
			callback(userIds);
			connection.release();
			return;
		}

		var query =  'SELECT id from user';
		connection.query( query,function(err, rows) {
			if(err){
				callback(userIds);
			}else{
				rows.forEach(function(row){
					userIds.push(row.id);
				});

				callback(userIds);
			}
			connection.release();
		});
	});
}

function getUserImagePathPrefix(){
	return "/assets/images/profile/";
}

exports.getUserIds  = getUserIds;

exports.getUserImagePathPrefix  = getUserImagePathPrefix;

exports.addUser  = addUser;

exports.isEmailAlreadyPresent = isEmailAlreadyPresent;

exports.getUserDetails  = getUserDetails;

exports.loginUser = loginUser;
