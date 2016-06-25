var express = require('express');
var config = require("./config.js");
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var cookieParser = require('cookie-parser');
var session = require('express-session');
var userModel = require('./model/user.js');
var KnexSessionStore = require('connect-session-knex')(session);
var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var notificationModel = require('./model/notification.js');
var msgInsertionTimer;

var Knex = require('knex');
var knex = Knex({
  client: 'mysql',
  connection: {
    host: config.database.host,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database
  }
});

var store = new KnexSessionStore({
  knex: knex,
  tablename: 'sessions'
});

if (config.notification_generator.enable) {
  notificationModel.populateUserIdList(function () {
    startRandomInsertionOfNotificationMsg();
  });
}

function startRandomInsertionOfNotificationMsg() {
  msgInsertionTimer = setInterval(addNewNotificationMsg, config.notification_generator.timer);
}

function stopRandomInsertionOfNotificationMsg() {
  clearInterval(msgInsertionTimer);
}

function addNewNotificationMsg() {
  notificationModel.addNewRandomNotificationMessage(function (retObj) {
    if (retObj.success) {
      notificationModel.getNotificationMsgData(retObj.notificationId, function (retObj) {
        var notificationMsg = retObj.notificationMsg;
        emitNotificationMsg(notificationMsg.to_user_id, [notificationMsg]);
      });
    }
  });
}

function emitNotificationMsg(toUserId, notificationMsgs) {
  console.log("Notification sent to " + toUserId);
  io.to(toUserId).emit("notificationMsg", JSON.stringify({
    "notificationMsgs": notificationMsgs
  }));
}

app.use("/assets", express.static(__dirname + '/public/assets'));

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(cookieParser());

app.use(session({
  store: store,
  secret: '1234567890QWERTY',
  resave: true,
  saveUninitialized: false
}));

function isLoggedInUser(req) {
  return req.session && req.session.user != null;
}

function getUserSessionData(req) {
  return req.session && req.session.user;
}

app.get('/', function (req, res) {
  var isLoggedIn = isLoggedInUser(req);
  var templateData = {
    isLoggedInUser: isLoggedIn,
    userSession: getUserSessionData(req),
    notificationMsgs: [],
    notificationPicPrefix: userModel.getUserImagePathPrefix()
  };

  if (isLoggedIn) {
    notificationModel.getAllNotificationForUser({userId: req.session.user.id}, function (retObj) {
      if (retObj.success) {
        templateData.notificationMsgs = retObj.notificationMsgs;
      }
      render();
    });
  } else {
    render();
  }

  function render() {
    res.render('pages/index', templateData);
  }
});

app.post('/readNotificationMsg', jsonParser, function (req, res) {
  if (isLoggedInUser(req)) {
    notificationModel.markAsMsgAsRead(req.body.msgIds, req.session.user.id, function (retObj) {
      if (retObj.success) {
        res.json({
          success: true
        });
      } else {
        res.json({
          success: false,
          err_code: retObj.err_code
        });
      }
    });
  } else {
    res.json({
      success: false,
      err_code: "Invalid session"
    });
  }
});

app.post('/pullNotificationMsg', jsonParser, function (req, res) {
  if (isLoggedInUser(req)) {
    notificationModel.getAllNotificationForUser({
      userId: req.session.user.id,
      minMsgId: req.body.maxMsgIdInStore
    }, function (retObj) {
      if (retObj.success) {
        res.json({
          success: true,
          notificationMsgs: retObj.notificationMsgs
        });
      } else {
        res.json({
          success: false,
          err_code: retObj.err_code
        });
      }
    });
  } else {
    res.json({
      success: false,
      err_code: "Invalid session"
    });
  }
});


app.post('/login', jsonParser, function (req, res) {

  userModel.loginUser(req.body.email, req.body.password, function (retObj) {

    if (retObj.isPresent) {
      req.session.user = retObj.userData;
      res.json({
        success: true
      });
    } else {
      res.json({
        success: false,
        err_code: retObj.err_code
      });
    }
  });
});


app.post('/signUp', jsonParser, function (req, res) {

  userModel.addUser(req.body, function (retObj) {

    if (retObj.success) {
      notificationModel.onNewUserAdded(retObj.userData.id);
      req.session.user = retObj.userData;
      res.json({
        success: true
      });
    } else {
      res.json({
        success: false,
        err_code: retObj.err_code
      });
    }
  });
});

app.get('/logout', function (req, res) {
  req.session.destroy(function () {
    res.redirect('/');
  });
});

server.listen(8080);

var sessionMiddleware = session({
  store: store,
  secret: '1234567890QWERTY',
  resave: true,
  saveUninitialized: false
});

io.use(function (socket, next) {
  sessionMiddleware(socket.request, socket.request.res, next);
});


io.on('connection', function (socket) {
  var request = socket.request;
  if (isLoggedInUser(request)) {
    var userId = request.session.user.id;

    socket.on("getNewMsgs", function (minMsgIdOnClient) {
      notificationModel.getAllNotificationForUser({
        userId: userId,
        minMsgId: minMsgIdOnClient
      }, function (retObj) {
        if (retObj.success && retObj.notificationMsgs.length) {
          emitNotificationMsg(userId, retObj.notificationMsgs);
        }
      });
    });
    socket.join(userId,
      function () {
        socket.emit("joined");
      });
  } else {
    socket.disconnect();
  }
});