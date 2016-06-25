(function(window){
  window.Notification = {
    init: function(notificationMsgs, notificationPicPrefix, isLoggedIn){
      var oThis = this;
      if(isLoggedIn){
        Notification.Manager.getInstance().init(notificationMsgs, notificationPicPrefix);
      }else{
        Notification.authModal.init();
      }
      oThis.addDomListener();
    },

    addDomListener: function(){
      $(".profile-setting-icon").click(function(){
          $(".profile-setting-dropdown").toggleClass("open");
      })
    }
  }
})(window);