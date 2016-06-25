(function (Notification) {

  var privateCollection = {
    init: function () {
      privateCollection.addEventListener();
    },

    addEventListener: function () {
      $('#sign_in_modal').on('show.bs.modal', privateCollection.cleanErrorInSignInModal);
      $('#sign_up_modal').on('show.bs.modal', privateCollection.cleanErrorInSignUpModal);
      $("#user_login").click(function(){
        privateCollection.onUserLoginClick();
      });

      $("#user_sign_up").click(function(){
        privateCollection.onUserSignUpClick();
      });
    },

    cleanErrorInSignInModal: function(){
      $("#sign_in_modal").find('.server_error').html("").end().find(".err").removeClass("err");
    },

    cleanErrorInSignUpModal: function(){
      $("#sign_up_modal").find('.server_error').html("").end().find(".err").removeClass("err");
    },

    validateSignUpFields: function(jEmail, jName, jPassword, jConfirmPassWord){
      var isValid = true;
      if(!privateCollection.validateEmail(jEmail.val())){
        isValid = false;
        jEmail.addClass("err");
      }

      if(jName.val().trim() == ""){
        isValid = false;
        jName.addClass("err");
      }

      if(jPassword.val() != jConfirmPassWord.val() || jPassword.val()==""){
        isValid = false;
        jPassword.addClass("err");
        jConfirmPassWord.addClass("err");
      }
      return isValid;
    },

    onUserSignUpClick: function(){
      var jEmail = $("#sign_up_email"),
        jName = $("#sign_up_name"),
        jPassword = $("#sign_up_password"),
        jConfirmPassWord = $("#sign_up_conf_password");

      privateCollection.cleanErrorInSignUpModal();
      if(privateCollection.validateSignUpFields(jEmail,jName,jPassword,jConfirmPassWord)){
        var formData = {
          "email" : jEmail.val().trim(),
          "password": jPassword.val(),
          "name": jName.val().trim()
        };
        $.ajax({
          type 		: 'POST',
          url 		: "/signUp",
          data 		: JSON.stringify(formData),
          dataType 	: 'json',
          contentType: 'application/json'
        }).done(function(res) {
          $.pageLoader("hide");
          if(res.success){
            window.location = "/";
          }else{
            $("#sign_up_modal").find(".server_error").html(res.err_code);
          }
        });
        $.pageLoader();

      }
    },

    onUserLoginClick: function() {
      var jEmail = $("#sign_in_email"),
        email = jEmail.val().trim(),
        pass = $("#sign_in_password").val();

      privateCollection.cleanErrorInSignInModal();
      if(privateCollection.validateEmail(email)){
        var formData = {
          "email" : email,
          "password": pass
        };
        $.ajax({
          type 		: 'POST',
          url 		: "/login",
          data 		: JSON.stringify(formData),
          dataType 	: 'json',
          contentType: 'application/json'
        }).done(function(res) {
          $.pageLoader("hide");
          if(res.success){
            window.location = "/";
          }else{
            $("#sign_in_modal").find(".server_error").html(res.err_code);
          }
        });
        $.pageLoader();


      }else{
        jEmail.addClass("err");
      }

    },

    validateEmail: function(email){
      var emailReg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
      return !( email === '' || !emailReg.test( email) )
    }
  };



  Notification.authModal = {
    init: privateCollection.init
  };


})(Notification);