var poolModule = require('./mysql_pool.js');
var user = require('./user.js');

var userIdList = [];

var notificationMsgs = [
  "posted a photo on your wall",
  "commented on your last video",
  "liked your photo",
  "commented on your video",
  "commented on your status",
  "is now friend with you",
  "poked you",
  "reminds you of the memory",
  "shared a video you you",
  "tagged a photo of you",
  "has become friend of you",
  "watched the video you shared"
];

function addNewRandomNotificationMessage(callback) {
  var toUserId = getRandomUserId(),
    fromUserId = getRandomUserId(toUserId),
    randomMsg = getRandomMsg();

  var retObj = {
    success: false,
    err_code: ""
  };

  poolModule.pool.getConnection(function (err, connection) {
    if (err) {
      retObj.err_code = err.code;
      callback(retObj);
      connection.release();
      return;
    }

    var query = 'Insert into notification(from_user_id, msg, to_user_id) values (?,?,?)';
    var values = [fromUserId, randomMsg, toUserId];

    connection.query(query, values, function (err, rows) {

      if (err) {
        retObj.err_code = err.code;
        callback(retObj);

      } else {
        retObj.success = true;
        retObj.notificationId = rows.insertId;
        callback(retObj);
      }
      connection.release();

    });
  });

}

function getRandomUserId(excludingUserId) {
  if (excludingUserId) {
    var newUserIdList = [];
    userIdList.forEach(function (userId) {
      if (excludingUserId == userId) {
        return;
      }
      newUserIdList.push(userId);
    });
    return newUserIdList[getRandomArrayIndex(newUserIdList)];

  } else {
    return userIdList[getRandomArrayIndex(userIdList)];
  }
}

function getRandomMsg() {
  return notificationMsgs[getRandomArrayIndex(notificationMsgs)];
}

function getRandomArrayIndex(array) {
  return Math.floor(Math.random() * array.length);
}
function populateUserIdList(callback) {
  user.getUserIds(function (userIds) {
    userIdList = userIds;
    callback();
  });
}

function  getNotificationMsgData(notificationId, callback){
  var retObj = {
    success: false,
    err_code: ""
  };

  poolModule.pool.getConnection(function (err, connection) {
    if (err) {
      retObj.err_code = err.code;
      callback(retObj);
      connection.release();
      return;
    }

    var query = 'select notification.id as msg_id,msg,is_read,user_name, pic, to_user_id from notification,user where notification.from_user_id = user.id and notification.id = ?';
    var values = [notificationId];

    connection.query(query, values, function (err, rows) {

      if (err) {
        retObj.err_code = err.code;
        callback(retObj);

      } else {
        retObj.success = true;
        retObj.notificationMsg = rows[0];
        callback(retObj);
      }
      connection.release();

    });
  });
}

function getAllNotificationForUser(option, callback){
  var retObj = {
    success: false,
    err_code: ""
  },
    userId = option.userId,
    minMsgId = option.minMsgId;

  poolModule.pool.getConnection(function (err, connection) {
    if (err) {
      retObj.err_code = err.code;
      callback(retObj);
      connection.release();
      return;
    }



    var query = 'select notification.id as msg_id,msg,is_read,user_name, pic, to_user_id from notification,user where notification.from_user_id = user.id and notification.to_user_id = ?';
    if(minMsgId){
      query+= ' and notification.id > ' + minMsgId;
    }

    var values = [userId];

    connection.query(query, values, function (err, rows) {

      if (err) {
        retObj.err_code = err.code;
        callback(retObj);

      } else {
        retObj.success = true;
        retObj.notificationMsgs = rows;
        callback(retObj);
      }
      connection.release();

    });
  });
}


function markAsMsgAsRead(msgIds, userId, callback){
  var retObj = {
    success: false,
    err_code: ""
  };

  poolModule.pool.getConnection(function (err, connection) {
    if (err) {
      retObj.err_code = err.code;
      callback(retObj);
      connection.release();
      return;
    }

    var query = 'update notification set is_read = 1 where id in('+msgIds.join(",")+') and to_user_id = ?';
    var values = [userId];
    connection.query(query, values, function (err, rows) {
      if (err) {
        retObj.err_code = err.code;
        callback(retObj);

      } else {
        retObj.success = true;
        callback(retObj);
      }
      connection.release();

    });
  });
}

function onNewUserAdded(userId) {
  userIdList.push(userId);
}

module.exports.markAsMsgAsRead = markAsMsgAsRead;
module.exports.onNewUserAdded = onNewUserAdded;
module.exports.addNewRandomNotificationMessage = addNewRandomNotificationMessage;
module.exports.populateUserIdList = populateUserIdList;
module.exports.getNotificationMsgData = getNotificationMsgData;
module.exports.getAllNotificationForUser = getAllNotificationForUser;