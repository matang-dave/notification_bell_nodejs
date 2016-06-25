(function (Notification) {

  //{"msg_id":2,"msg":"posted a photo on your wall","is_read":0,"user_name":"Greg Lucas","pic":"1_greg.jgp"}

  var notificationManager = null;

  var AJAX_TIMER = 5000;

  var NotificationManager = function () {
    this.notificationStore = {};
    this.unReadMsgIds = [];
    this.supportWebSocket = typeof (WebSocket) == "function";
  };


  var proto = {
    jMsgCounter: $(".notification-counter"),
    jNotificationContainer: $("#notification-content"),
    jNotificationWrapper: $("#notification-wrapper"),
    notificationStore: null,
    notificationPicPrefix: "",
    unReadMsgIds: null,
    maxMsgIdInStore: 0,
    ajaxTimer: null,
    socketUrl: "/",
    ajaxUrl: "/pullNotificationMsg",

    supportWebSocket: false,

    init: function (notificationMsgs, notificationPicPrefix) {
      var oThis = this;
      oThis.notificationPicPrefix = notificationPicPrefix;
      oThis.addNotificationMsgs(notificationMsgs);
      oThis.startMsgPulling();
      oThis.addEventListener();
    },

    addEventListener: function () {
      var oThis = this;
      $(".notification-header-icon").click(function () {
        var jNotificationWrapper = oThis.jNotificationWrapper;
        if (jNotificationWrapper.hasClass("open")) {
          jNotificationWrapper.removeClass("open");
        } else {
          jNotificationWrapper.addClass("open");
          oThis.markMsgsRead();
        }
        $("#notification-wrapper").animate({
          height: "toggle"
        }, 500);

      });
    },

    addNotificationMsgs: function (notificationMsgs) {
      var oThis = this,
        jNotificationWrapper = oThis.jNotificationWrapper,
        newMsgToAppendInView = oThis.addMsgToStore(notificationMsgs);
      if (jNotificationWrapper.hasClass("open")) {
        oThis.markMsgsRead();
      }
      oThis.updateView(newMsgToAppendInView);

    },

    addMsgToStore: function (notificationMsgs) {
      var oThis = this,
        notificationStore = oThis.notificationStore,
        newAddedMsgs = [],
        maxMsgIdInStore = oThis.maxMsgIdInStore;

      _.each(notificationMsgs, function (notificationMsg) {
        if (notificationStore.hasOwnProperty(notificationMsg.msg_id)) {
          return;
        }
        notificationStore[notificationMsg.msg_id] = notificationMsg;
        newAddedMsgs.push(notificationMsg);
        var msgId = notificationMsg.msg_id;
        if (maxMsgIdInStore < msgId) {
          maxMsgIdInStore = msgId;
        }
        if (notificationMsg.is_read == 0) {
          oThis.unReadMsgIds.push(msgId);
        }
      });

      oThis.maxMsgIdInStore = maxMsgIdInStore;
      return newAddedMsgs;
    },

    getUnreadCount: function () {
      return this.unReadMsgIds.length;
    },

    removeMsgIdFromUnreadMsgIds: function (readMsgIds) {
      var oThis = this;
      oThis.unReadMsgIds = _.difference(oThis.unReadMsgIds, readMsgIds);
      oThis.updateMsgCounter();
    },

    markMsgsRead: function () {
      var oThis = this,
        unReadMsgIds = oThis.unReadMsgIds;


      if (unReadMsgIds.length > 0) {
        var formData = {
          "msgIds": unReadMsgIds
        };
        $.ajax({
          type: 'POST',
          url: "/readNotificationMsg",
          data: JSON.stringify(formData),
          dataType: 'json',
          contentType: 'application/json'
        }).done(function (res) {
        });
      }
      oThis.removeMsgIdFromUnreadMsgIds(unReadMsgIds);

    },

    updateView: function (msgToAppendInView) {
      var oThis = this;

      oThis.updateMsgCounter();
      oThis.prependMsgsToNotificationContainer(msgToAppendInView);
    },

    updateMsgCounter: function () {
      var oThis = this;
      oThis.jMsgCounter.html(oThis.getUnreadCount());

    },

    prependMsgsToNotificationContainer: function (msgToAppendInView) {
      var oThis = this,
        jNotificationContainer = oThis.jNotificationContainer,
        template = $("#notificationMsgContent").html(),
        imgPrefix = oThis.notificationPicPrefix,
        htmlToPrepend = "";

      msgToAppendInView = msgToAppendInView.sort(function (msg1, msg2) {
        return msg1.msg_id - msg2.msg_id;
      });

      _.each(msgToAppendInView, function (msg) {
        htmlToPrepend = Mustache.to_html(template, {
            pic_prefix: imgPrefix,
            pic: msg.pic,
            user_name: msg.user_name,
            msg: msg.msg
          }) + htmlToPrepend;
      });

      jNotificationContainer.prepend(htmlToPrepend);
    },

    startMsgPulling: function () {
      var oThis = this;
      if (oThis.supportWebSocket) {
        oThis.initSocketConn();
      } else {
        oThis.startAjaxPulling();
      }
    },

    startAjaxPulling: function () {
      var oThis = this;
      oThis.ajaxTimer = setInterval($.proxy(oThis.getNotificationMsgThroughAjax, oThis), AJAX_TIMER);
    },

    stopAjaxPulling: function () {
      clearInterval(this.ajaxTimer);
    },

    getNotificationMsgThroughAjax: function () {
      var oThis = this,
        maxMsgIdInStore = oThis.maxMsgIdInStore;

      var formData = {
        "maxMsgIdInStore": maxMsgIdInStore
      };

      $.ajax({
        type: 'POST',
        url: oThis.ajaxUrl,
        data: JSON.stringify(formData),
        dataType: 'json',
        contentType: 'application/json'
      }).done(function (res) {
        if (res.success) {
          oThis.addNotificationMsgs(res.notificationMsgs);
        }
      });
    },

    initSocketConn: function () {
      var oThis = this;

      oThis.socket = io(oThis.socketUrl + "?maxMsgIdInStore=" + oThis.maxMsgIdInStore);

      oThis.socket.on('notificationMsg', function (data, fn) {
        var dataObj = JSON.parse(data);
        oThis.addNotificationMsgs(dataObj.notificationMsgs)
      });

      oThis.socket.on('joined', function (data, fn) {
        oThis.socket.emit("getNewMsgs", oThis.maxMsgIdInStore);
      });

      oThis.socket.on('reconnect_failed', function (data) {
        oThis.startAjaxPulling();
      });
    }
  };

  NotificationManager.prototype = proto;

  Notification.Manager = {
    getInstance: function () {
      if (!notificationManager) {
        notificationManager = new NotificationManager();
      }
      return notificationManager;
    }
  };


})(Notification);