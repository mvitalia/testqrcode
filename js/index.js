function check_login(){
    var isLogin = localStorage.getItem('login');

    if(isLogin && localStorage.getItem('username') != null)
    {
        $(".SiLogin").html("");
        var li_dati="<span style='font-size:11px !important; color:#fff; padding-left:10px;'>"+localStorage.getItem('username')+"</span>";

        $(".SiLogin").append(li_dati);
        $(".SiLogin").show();
        $(".logoutApp").show();
    }
}

//home
$(document).on("pagebeforeshow", "#home", function () {
    check_login();
});

//pagina login
$(document).on("pagebeforeshow", "#login", function () {
    $("#usernameLogin").val("");
    $("#passwordLogin").val("");

    check_login();
    
});

$('#scan_read').click( function() 
{
    cordova.plugins.barcodeScanner.scan(
    function (result) {
        window.open(result.text, '_blank');
        /*alert("We got a barcode\n" +
                "Result: " + result.text + "\n" +
                "Format: " + result.format + "\n" +
                "Cancelled: " + result.cancelled);            */
    }, 
    function (error) {
        alert("Scanning failed: " + error);
    });
    }
);

//pagina notizie
$(document).on("pagebeforeshow", "#database", function () {
    check_login();  
    $("#lista_datiJson").html("");
    selezionoDati();
});

//pagina notifica
$(document).on("pagebeforeshow", "#notifica", function () {
    check_login();
});

//pagina richiesta informazioni
$(document).on("pagebeforeshow", "#inviaInfo", function () {
    $("#nomeInfo").val(""); 
    $("#cognomeInfo").val(""); 
    $("#emailInfo").val(""); 
    $("#richiestaInfo").val("");   
    $("#privacyInfo").prop('checked', false);  

    check_login();
});

//pagina richiesta info
$(document).on("pagebeforeshow", "#infoMvitalia", function () {
    $("#nomeMv").val(""); 
    $("#cognomeMv").val(""); 
    $("#emailMv").val("");  
    $("#privacyMv").prop('checked', false);  
    check_login();
});

    

$(document).on("pageshow", "#home", function () {
    carica_slider();
});


$(document).on("pageshow", "#notifica", function () {
    $(".schedaNotifica").html("");
    cordova.plugins.notification.badge.decrease();
    caricaNotifica(); 
});


$('#search').keyup(function () {	
	caricaNotificheFiltrate();
});	

    // Validazione e registrazione utente
$('#registrazioneSincro').validate({
    rules: {
        nome: {
            required: true
        },
        cognome: {
            required: true
        },
        email: {
            required: true,
            email: true
        },
        lnascita: {
            required: true
        },
        dataNascita: {
            required: true
        },
        citta: {
            required: true
        },
        username: {
            required: true
        },
        pass: {
            required: true
        },
         privacyMv: {
            required: true
        }
    },
    messages: {
        nome: {
            required: "Campo obbligatorio"
        },
        cognome: {
            required: "Campo obbligatorio"
        },
        email: {
            required: "Campo obbligatorio",
            email:"Prego inserire un indirizzo e-mail corretto"
        },
         lnascita: {
            required: "Campo obbligatorio"
        },
         dataNascita: {
            required: "Campo obbligatorio"
        },
         citta: {
            required: "Campo obbligatorio"
        },
         username: {
            required: "Campo obbligatorio"
        },
         pass: {
            required: "Campo obbligatorio"
        },
        privacyMv: {
            required: "Acconsenti al trattamento della privacy"
        }
    },
    errorPlacement: function (error, element) {
        error.appendTo(element.parent().prev());
    },
    errorElement: "span",
    wrapper: "p",
    submitHandler: function (form) {
     var privacy;
      if ($('#privacyMv').is(":checked"))
      {
         privacy=1
      }else{
         privacy=0
      }
      var nome = $("#nome").val();
      var cognome = $("#cognome").val();
      var email = $("#email").val();
      var luogoN = $("#lnascita").val();
      var dataN = $("#dataNascita").val();
      var citta = $("#citta").val();
      var username = $("#username").val();
      var password = $("#pass").val();
      aggiungiUtente(nome,cognome,email,luogoN,dataN,citta,username,password,privacy);
      return false;
    }
});


// Validate del form login 
$('#loginSincro').validate({
    rules: {
        usernameLogin: {
            required: true
        },
        passLogin: {
            required: true
        }
    },
    messages: {
        usernameLogin: {
            required: "Campo obbligatorio"
        },
        passLogin: {
            required: "Campo obbligatorio"
        }
    },
    errorPlacement: function (error, element) {
        error.appendTo(element.parent().prev());
    },
    errorElement: "span",
    wrapper: "p",
    submitHandler: function (form) {
     var usernameLogin = $("#usernameLogin").val();
      var passLogin = $("#passLogin").val();
      loginUtente(usernameLogin,passLogin);  
      return false;
    }
});
 
 
// Validate del form recupero password
$('#recuperoPass').validate({
    rules: {
        emailRecuperoPass: {
            required: true,
            email: true
        }
    },
    messages: {
        usernameLogin: {
            required: "Campo obbligatorio",
            email: "Inserire un E-mail valida"
        }
    },
    errorPlacement: function (error, element) {
        error.appendTo(element.parent().prev());
    },
    errorElement: "span",
    wrapper: "p",
    submitHandler: function (form) {
     var emailRecuperoPass = $("#emailRecuperoPass").val();
     recuperoPassword(emailRecuperoPass);  
     return false;
    }
});


$('.logoutApp').click(function(){
    localStorage.removeItem('login');
    localStorage.removeItem('username');
    $(".SiLogin").hide();
    $(".logoutApp").hide();
    
});


// popolo la notifica   
 $(document).on("click", ".storage", function () {
     var id = $(this).parents("div").attr("id");
     sessionStorage.setItem('ID_not', id);
      cancellaNotifica ();
});



$(document).on("click", ".detail", function () {
     var id = $(this).parents("div").data("itemid");
     localStorage.removeItem("Id_notifica");
     localStorage.setItem('Id_notifica', id);
     $( ":mobile-pagecontainer" ).pagecontainer( "change", "#notifica", {    transition: "flip", reload:false, allowSamePageTransition:true } );
     
});


$('#cancellaNot').click(function(){
      cancellaNotifica ();
});

$('#noCancellanot').click(function(){
        $("#purchase").popup( "close" );
});

$('#cancellaTutteNotifiche').click(function(){
       cancellaAllNotifiche();
});


/*$(document).on("click", ".chiudiNotifica", function () {
     var id = $(this).parents("div").data("item");
    $('.box_n'+id+'').hide();
})*/

/*$(document).on("click", ".apriNotificaDettaglio", function () {
     var id = $(this).parents("div").data("item");
     localStorage.setItem('Id_notifica', id);
    $('#box_n'+id+'').hide();
    $( ":mobile-pagecontainer" ).pagecontainer( "change", "notifica.html", {    transition: "flip", reload:true } );

});*/


// Validazione e invio email per l' informazione della notifica

$('#inviaInfoNotifica').validate({
    rules: {
        nomeInfo: {
            required: true
        },
        cognomeInfo: {
            required: true
        },
        emailInfo: {
            required: true,
            email: true
        },
        richiestaInfo: {
            required: true
        },
         privacyInfo: {
            required: true
        }
    },
    messages: {
        nomeInfo: {
            required: "Campo obbligatorio"
        },
        cognomeInfo: {
            required: "Campo obbligatorio"
        },
        emailInfo: {
            required: "Campo obbligatorio",
            email:"Inserire un indirizzo e-mail corretto"
        },
        richiestaInfo: {
            required: "Campo obbligatorio"
        },
        privacyInfo: {
            required: "Acconsenti il trattamento della privacy"
        }
    },
    errorPlacement: function (error, element) {
        error.appendTo(element.parent().prev());
    },
    errorElement: "span",
    wrapper: "p",
    submitHandler: function (form) {
     var pInfo
     if ($('#privacyInfo').is(":checked"))
      {
         pInfo=1
      }else{
         pInfo=0
      }
      var nInfo = $("#nomeInfo").val();
      var cInfo = $("#cognomeInfo").val();
      var eInfo = $("#emailInfo").val();
      var rInfo = $("#richiestaInfo").val();
     inviaInformazione(pInfo,nInfo,cInfo,eInfo,rInfo);
        return false;
    }
});

// Validazione e invio email Mvitalia


$('#inviaInfoMv').validate({
    rules: {
        nomeMv: {
            required: true
        },
        cognomeMv: {
            required: true
        },
        emailMv: {
            required: true,
            email: true
        },
        richiestaMv: {
            required: true
        },
         privacyMv: {
            required: true
        }
    },
    messages: {
        nomeMv: {
            required: "Campo obbligatorio"
        },
        cognomeMv: {
            required: "Campo obbligatorio"
        },
        emailMv: {
            required: "Campo obbligatorio",
            email:"Inserire un indirizzo e-mail corretto"
        },
        richiestaMv: {
            required: "Campo obbligatorio"
        },
        privacyMv: {
            required: "Acconsenti il trattamento della privacy"
        }
    },
    errorPlacement: function (error, element) {
        error.appendTo(element.parent().prev());
    },
    errorElement: "span",
    wrapper: "p",
    submitHandler: function (form) {
     var pMv
     if ($('#privacyMv').is(":checked"))
      {
         pMv=1
      }else{
         pMv=0
      }
      var nMv = $("#nomeMv").val();
      var cMv = $("#cognomeMv").val();
      var eMv = $("#emailMv").val();
      var rMv = $("#richiestaMv").val();
      inviaInformazioneMv(pMv,nMv,cMv,eMv,rMv);
        return false;
    }
});