// Variabili globali per il login
var usernameLoginApp;
function checkInternet() 
{
    var online = window.navigator.onLine;
    if (online) {
        return true;
    } else {
        return false;
    }
}


// Prelevo i dati dal server
function caricoDatiServerSalvoInDb ()
{
    if (checkInternet) {
        // Prima bisonga cancellare un db se già essitente è crearlo se non esiste
        db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);
        db.transaction(
            // Metodo di chiamata asincrona
            function(tx) {
                tx.executeSql("DROP TABLE IF EXISTS clienti");
                tx.executeSql("CREATE TABLE IF NOT EXISTS clienti (id INTEGER PRIMARY KEY AUTOINCREMENT,identificativo, nome, cognome, email,foto)");
                },
            function () {
                // alert("Errore");
                },
            function(){
                // alert("Cancellazione effettuata");
            }
        )
        // Prelevo dati dal server
        $.getJSON("http://www.trovoperte.com/admin/CS_Sync.aspx", function (dati) {
            var li_dati = "";
            $.each(dati, function (i, name) {
                // Inserisco dati nel db sqllite dell' App
                db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);
                db.transaction(
                    // Metodo di chiamata asincrona
                    function(tx) {
                        tx.executeSql("INSERT INTO clienti (identificativo,nome,cognome,email,foto) VALUES (?,?,?,?,?)",[name.ID,name.nome,name.cognome,name.email,name.foto]);
                        },
                        onDbError,
                    function(){
                        //  alert("Inserimento effettuato");
                    }
                )
            });
            selezionoDati ();
        });
        
    } else {
        // Carico i dati dal db se è stato creato almeno una volta
            selezionoDati ();
    }
            
}

function selezionoDati ()
{
   db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);  
   db.transaction(select,successoSelect);                    
}

function select(tx)
{
    tx.executeSql("SELECT C.ID as ID_notifica,  N.*, C.* FROM notizie as N, notifiche as C WHERE C.ID_notizia=N.ID order by data_ora desc",[], successoSelect,erroreSelect);     
}

function successoSelect(tx,dati)
{
    var len = dati.rows.length;
    
    var li_dati="";
    if(len!=0)
    {
        for(var i=0; i<len; i++)
        {
            var data = dati.rows.item(i).data_ora;
            splitdata = data.split(" ");
            var partedata = splitdata[0].split("-");
            var parteora = splitdata[1].split(":");

            var dataCorretta = partedata[2] + "/" + partedata[1] + "/" + partedata[0] + " " + parteora[0] + ":" + parteora[1];
                
            li_dati+="<div id="+dati.rows.item(i).ID_notifica+" data-itemid="+dati.rows.item(i).ID_notizia+" class='tipo_"+dati.rows.item(i).tipologia+" single-news animated fadeinright delay-2'>";
            li_dati+="<h4 class='single-news-title'><a class='detail' href='#' >"+dati.rows.item(i).titolo+"</a></h4>";
            li_dati+="<span class='single-news-category'>"+dataCorretta+"</span><div class='single-news-channel'>"+dati.rows.item(i).descrizione.replace("<p>","").replace("</p>","").substring(0,30)+"...</div>";
            li_dati+="<div class='storage btn_cancella_notifica'><i id='cancellaNot' class='ion-android-close'></i></div>";

            var icona_notifica = "ion-social-rss";
            if (dati.rows.item(i).tipologia == "dispositivo")
                icona_notifica = "ion-android-walk";
            li_dati+="<div class='btn_tipologia_notifica'><i class='"+icona_notifica+"'></i></div><div class='clr'></div></div>";
        }
        $("#cancellaTutteNotifiche").show();
        $("#noNotifiche").hide();
    }else{
        $("#cancellaTutteNotifiche").hide();
        $("#noNotifiche").show();
    }

    $("#lista_datiJson").append(li_dati);
}

function erroreSelect (e)
{
    alert("Select non avvenuta"+e);
}

function onDbError ()
{
    alert("Errore");
}

// Registra utente
function aggiungiUtente(nome,cognome,email,luogoN,dataN,citta,username,password,privacy)
{
       $.ajax({
        type: "POST",
		data: '{nome:"'+nome+'",cognome:"'+cognome+'",email:"'+email+'",luogo_nascita:"'+luogoN+'",data_nascita:"'+dataN+'",citta:"'+citta+'",username:"'+username+'",password:"'+password+'",privacy:"'+privacy+'"}',
		url: 'http://magicbeep.mvclienti.com/webservices/CS_aggiungiCliente.aspx/prova',
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
		success: function(data){
            var ID_utente = data.d;
            var successo ="<div class='modal-content'><h4>Registrazione Effettuata </h4><p>Registrazione al sistema effettuata con successo</p></div>";
            successo+="<div class='modal-footer'> <a href='#' class='modal-action modal-close waves-effect waves-green btn-flat'>Chiudi</a></div>";
            $("#box_registrazione").html("");
            $("#box_registrazione").append(successo);
            $("#btn_box_Registrazione").click();
		},
		error: function(e){
            var fallito ="<div class='modal-content'><h4>Registrazione Fallita </h4><p>Connessione internet assente</p></div>";
            fallito+="<div class='modal-footer'> <a href='#' class='modal-action modal-close waves-effect waves-green btn-flat'>Chiudi</a></div>";
            $("#box_registrazione").html("");
            $("#box_registrazione").append(fallito);
            $("#btn_box_Registrazione").click();
		}
	});
}

// Login utente
function loginUtente(usernameLogin,passLogin)
{
    localStorage.setItem('username',usernameLogin);
    $.ajax({
        type: "POST",
        data: '{userLogin:"'+usernameLogin+'",passLogin:"'+passLogin+'"}',
        url: 'http://magicbeep.mvclienti.com/webservices/CS_loginUtente.aspx/login',
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        success: function(data){
            var login = data.d;
            if(login!="")
            {
                localStorage.setItem('login', true);
                var benvenuto ="<div class='modal-content'><h4>Login Effettuato </h4><p>Benvenuto "+localStorage.getItem("username")+"</p></div>";
                benvenuto+="<div class='modal-footer'> <a href='#' class='modal-action modal-close waves-effect waves-green btn-flat'>Chiudi</a></div>";
                $("#box_successoLogin").html("");
                $("#box_successoLogin").append(benvenuto);
                $("#btn_box_Login").click();
            }else{
                var noBenvenuto="<div class='modal-content'><h4>Login Fallito </h4><p>Controlla di aver inserito i dati corretti o di avere una connessione internet disponibile </p></div>";
                noBenvenuto+="<div class='modal-footer'> <a href='#' class='modal-action modal-close waves-effect waves-green btn-flat'>Chiudi</a></div>";
                $("#box_successoLogin").html("");
                $("#box_successoLogin").append(noBenvenuto);
                $("#btn_box_Login").click();
            }
        },
        error: function(e){
            var noBenvenuto="<div class='modal-content'><h4>Login Fallito </h4><p>Controlla di aver inserito i dati corretti o di avere una connessione internet disponibile </p></div>";
            noBenvenuto+="<div class='modal-footer'> <a href='#' class='modal-action modal-close waves-effect waves-green btn-flat'>Chiudi</a></div>";
            $("#box_successoLogin").html("");
            $("#box_successoLogin").append(noBenvenuto);
            $("#btn_box_Login").click();
        }
    });
    
}

function caricaNotifica ()
{
    db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);
    db.transaction(selectNotifica,successoSelectNotifica);  
}

function selectNotifica(tx)
{
    tx.executeSql("SELECT * FROM notizie WHERE ID = "+localStorage.getItem('Id_notifica')+"",[], successoSelectNotifica,erroreSelect);        
}

function successoSelectNotifica(tx,dati)
{
    var len = dati.rows.length;
       
    var dettaglio_notifica="";
    if(len!=0)
    {
        // formattazione date
        // Data giusta attivo_da
        var data = dati.rows.item(0).attivo_da;
        var splitarray = new Array();
        splitarray = data.split(" ");
        var dataDue = splitarray[0];
        var arrayData = new Array ();
        arrayData = dataDue.split("-");
        var data_attivo_da = arrayData[2] + "-" + arrayData[1] + "-" + arrayData[0]; //aggiungere anche ora + " " + splitarray[1];
        // Data giusta attivo_a
        var dataTre = dati.rows.item(0).attivo_a;
        var splitarrayUno = new Array();
        splitarrayUno = dataTre.split(" ");
        var dataQuattro = splitarrayUno[0];
        var arrayDataDue = new Array ();
        arrayDataDue = dataQuattro.split("-");
        var data_attivo_a = arrayDataDue[2] + "-" + arrayDataDue[1] + "-" + arrayDataDue[0]; // aggiungere anche ora + " " + splitarrayUno[1];
        sessionStorage.setItem('titolo_notifica',dati.rows.item(0).titolo);
        
        //immagine notifica
        var immagineNot ="<img src='img/placeholder_notifica.jpg' alt='"+dati.rows.item(0).titolo+"'>";
        if (checkInternet && dati.rows.item(0).immagine!="")
            immagineNot ="<img src='http://magicbeep.mvclienti.com/public/upload_gallery/immagini/"+dati.rows.item(0).immagine+"' alt='"+dati.rows.item(0).titolo+"'>";

        // titolo notifica
        dettaglio_notifica +="<h2 class='uppercase'>"+dati.rows.item(0).titolo+"</h2>";
        
        // data notifica
        dettaglio_notifica +="<div class='post-author'><i class='ion-android-calendar avatar circle'></i><span>Valido dal "+data_attivo_da+" al "+data_attivo_a+"</span></div>";
        
        // descrizione notifica + linea
        
        dettaglio_notifica +="<div class='text-flow'>"+dati.rows.item(0).descrizione+"</div><div class='comments'>";

        // allegato
        if(dati.rows.item(0).allegato!="")
            dettaglio_notifica+="<a class='link' href='http://magicbeep.mvclienti.com/public/upload_gallery/immagini/"+dati.rows.item(0).allegato+"' target='_blank'><i class='ion-ios-cloud-download-outline'></i> "+dati.rows.item(0).allegato+"</a>";
        
        // link
        if(dati.rows.item(0).link!="")
            dettaglio_notifica+="<a class='link' href='http://"+dati.rows.item(0).link+"'><i class='ion-android-globe'></i> "+dati.rows.item(0).link+"</a>";
        
        
        // linea
        dettaglio_notifica+="</div>";
        
        // pulisco i box contenitori
        $(".appendDettaglioNotifica").html("");
        $("#box_img_notifica").html("");

        // appendo i nuovi dati
        $("#box_img_notifica").html(immagineNot);
        $(".appendDettaglioNotifica").html(dettaglio_notifica);
    }
     
}

function cancellaNotifica ()
{
    if (confirm("Sei sicuro di voler cancellare la notifica?"))  {
        // Cancellare notifica in base all 'id'
        var idNotifica = sessionStorage.getItem('ID_not');
        db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);
        db.transaction(
            // Metodo di chiamata asincrona
            function(tx) {
                tx.executeSql("DELETE FROM notifiche WHERE id=?",[idNotifica]);
            },
            function(){
                alert("Non è stato possibile cancellare la notizia. Riprova");
                
            },
            function(){
                //alert("Cancellazione effettua");
                
            }
        )
        $("#purchase").popup( "close" );
        $("#lista_datiJson").html("");
        selezionoDati();
    }
}

function cancellaAllNotifiche ()
{
    db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);
    db.transaction(
        // Metodo di chiamata asincrona
        function(tx) {
            tx.executeSql("DELETE FROM notifiche",[]);
        },
        function(){
            alert("Non è stato possibile cancellare le notizie. Riprova");
            
        },
        function(){
            // alert("Cancellazione effettua");
            
        }
    )
    $("#lista_datiJson").html("");
    selezionoDati();
}

// Gestire ancora la privacy nel file inviaInfo.aspx.cs
function inviaInformazione(privacy,nome,cognome,email,richiesta)
{
  
   $.ajax({
        type: "POST",
		data: '{nome:"'+nome+'",cognome:"'+cognome+'",email:"'+email+'",richiesta:"'+richiesta+'",privacy:"'+privacy+'",notizia:"'+ sessionStorage.getItem('titolo_notifica')+'"}',
		url: 'http://magicbeep.mvclienti.com/webservices/CS_inviaInfo.aspx/invia',
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
		success: function(data){
        var ritorno = data.d;

            var successo ="<div class='modal-content'><h4>Informazione Inviata </h4><p>Informazioni sulla notizia "+sessionStorage.getItem('titolo_notifica')+" inviata con successo</p></div>";
            successo+="<div class='modal-footer'> <a href='#' class='modal-action modal-close waves-effect waves-green btn-flat'>Chiudi</a></div>";
            $("#box_infoNotifica").html("");
            $("#box_infoNotifica").append(successo);
            $("#btn_box_infoNotifica").click();
		},
		error: function(e){
             var fallito ="<div class='modal-content'><h4>Invio Fallito </h4><p>Connessione internet assente</p></div>";
            fallito+="<div class='modal-footer'> <a href='#' class='modal-action modal-close waves-effect waves-green btn-flat'>Chiudi</a></div>";
            $("#box_infoNotifica").html("");
            $("#box_infoNotifica").append(fallito);
            $("#btn_box_infoNotifica").click();
		}
    });
}

function inviaInformazioneMv(pMv,nMv,cMv,eMv,rMv)
{
  $.ajax({
        type: "POST",
        data: '{nome:"'+nMv+'",cognome:"'+cMv+'",email:"'+eMv+'",richiesta:"'+rMv+'",privacy:"'+pMv+'",notizia:""}',
        url: 'http://magicbeep.mvclienti.com/webservices/CS_inviaInfoMv.aspx/invia',
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
        success: function(data){
        var ritorno = data.d;
        
            var successo ="<div class='modal-content'><h4>Informazione Inviata </h4><p>Informazioni sulla notizia inviata con successo</p></div>";
            successo+="<div class='modal-footer'> <a href='#' class='modal-action modal-close waves-effect waves-green btn-flat'>Chiudi</a></div>";
            $("#box_infoMvitalia").html("");
            $("#box_infoMvitalia").append(successo);
            $("#btn_box_infoMvitalia").click();

        },
        error: function(e){
            var fallito ="<div class='modal-content'><h4>Invio Fallito </h4><p>Connessione internet assente</p></div>";
            fallito+="<div class='modal-footer'> <a href='#' class='modal-action modal-close waves-effect waves-green btn-flat'>Chiudi</a></div>";
            $("#box_infoMvitalia").html("");
            $("#box_infoMvitalia").append(fallito);
            $("#btn_box_infoMvitalia").click();
        }
    });
}

function apriNotifica(id)
{
     localStorage.setItem('Id_notifica', id);
     
    $('#'+id+'').hide();
    
    $( ":mobile-pagecontainer" ).pagecontainer( "change", "#notifica", {    transition: "flip", reload:false, allowSamePageTransition:true } );
}

function salvaNotifica(id)
{
      
      $('#'+id+'').hide();
}


function condividiNotifica ()
{
   // Prendere i dati giusti da condividere
    db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);
    db.transaction(
        // Metodo di chiamata asincrona
        function(tx) {
            tx.executeSql("SELECT * FROM notizie WHERE ID = "+localStorage.getItem('Id_notifica')+"",[],
            function(tx,dati){
            var len = dati.rows.length;
            if(len!=0)
            {
                var immagine = "http://magicbeep.mvclienti.com/public/upload_gallery/immagini/"+dati.rows.item(0).immagine+"";
                var notifica = dati.rows.item(0).titolo +"\n\n" + dati.rows.item(0).descrizione.replace("<p>","").replace("</p>","\n");
                
                // link
                if(dati.rows.item(0).link!="")
                    notifica+="\n\n" + dati.rows.item(0).link;

                window.plugins.socialsharing.share(notifica, 'MagicBeep condividi notizia',immagine);
            }
            },
            function () {
                alert("Errore"+e.message);
            });
    });
}


function recuperoPassword(email)
{
   $.ajax({
        type: "POST",
		data: '{email:"'+email+'"}',
		url: 'http://magicbeep.mvclienti.com/webservices/CS_recuperoPassword.aspx/recupera',
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
		success: function(data){
        var ritorno = data.d;
         if(ritorno!="")
         {
            
            var successo ="<div class='modal-content'><h4>Recupero Password</h4><p>Controlla la tua E-mail per recuperare la password </p></div>";
            successo+="<div class='modal-footer'> <a href='#' class='modal-action modal-close waves-effect waves-green btn-flat'>Chiudi</a></div>";
            $("#box_Password").html("");
            $("#box_Password").append(successo);
            $("#btn_box_recuperoPassword").click();
         }else{
            var fallito ="<div class='modal-content'><h4>Recupero Password</h4><p>Fallito!!<br>Assicurati di aver inserito l' E-mail corretta</p></div>";
            fallito+="<div class='modal-footer'> <a href='#' class='modal-action modal-close waves-effect waves-green btn-flat'>Chiudi</a></div>";
            $("#box_Password").html("");
            $("#box_Password").append(fallito);
            $("#btn_box_recuperoPassword").click();
         }
        

		},
		error: function(e){
           var fallito ="<div class='modal-content'><h4>Recupero Password</h4><p>Fallito!!<br>Connessione internet assente</p></div>";
            fallito+="<div class='modal-footer'> <a href='#' class='modal-action modal-close waves-effect waves-green btn-flat'>Chiudi</a></div>";
            $("#box_Password").html("");
            $("#box_Password").append(fallito);
            $("#btn_box_recuperoPasswordFailed").click();
		}
     	});
}

function caricaNotificheFiltrate () {
     
   var searchFiled = $("#search").val();
   // Faccio query
    db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);
    db.transaction(
        // Metodo di chiamata asincrona
        function(tx) {
            tx.executeSql("SELECT C.ID as ID_notifica,  N.*, C.* FROM notizie as N, notifiche as C WHERE C.ID_notizia=N.ID AND N.titolo like '%"+searchFiled+"%' OR N.descrizione like '%"+searchFiled+"%'",[],
            function(tx,dati){
                var len = dati.rows.length;
                
                var li_dati="";
                if(len!=0)
                {
                
                    for(var i=0; i<len; i++)
                    {
                        var data = dati.rows.item(i).data_ora;
                        splitdata = data.split(" ");
                        var partedata = splitdata[0].split("-");
                        var parteora = splitdata[1].split(":");

                        var dataCorretta = partedata[2] + "/" + partedata[1] + "/" + partedata[0] + " " + parteora[0] + ":" + parteora[1];

                        li_dati+="<div id="+dati.rows.item(i).ID_notifica+" data-itemid="+dati.rows.item(i).ID_notizia+" class='tipo_"+dati.rows.item(i).tipologia+" single-news animated fadeinright delay-2'>";
                        li_dati+="<h4 class='single-news-title'><a class='detail' href='#' >"+dati.rows.item(i).titolo+"</a></h4>";
                        li_dati+="<span class='single-news-category'>"+dataCorretta+"</span><div class='single-news-channel'>"+dati.rows.item(i).descrizione.replace("<p>","").replace("</p>","").substring(0,30)+"...</div>";
                        li_dati+="<div class='storage btn_cancella_notifica'><i id='cancellaNot' class='ion-android-close'></i></div>";

                        var icona_notifica = "ion-social-rss";
                        if (dati.rows.item(i).tipologia == "dispositivo")
                            icona_notifica = "ion-android-walk";
                        li_dati+="<div class='btn_tipologia_notifica'><i class='"+icona_notifica+"'></i></div><div class='clr'></div></div>";
                        
                        $("#lista_datiJson").html("");
                        $("#lista_datiJson").append(li_dati);
                    }
                }
            
            

            },
            function () {
                alert("Errore"+e.message);
            });
    });
}

function carica_slider ()
{
    if (checkInternet) {
        $(".bg-v-2").css('background-image','url(http://magicbeep.mvclienti.com/webservices/magicbeep_home.jpg)');

        var li_dati = "";
        $.getJSON("http://magicbeep.mvclienti.com/webservices/slider_home.aspx", function (dati) {
            $.each(dati, function (i, name) {
                var classversion="slider-bottom-right";
                if (i %2 == 1) classversion = "slider-bottom-left";
                
                li_dati+="<div class='swiper-slide'> <div class='" + classversion + " valign-wrapper'><div class='valign center-align width-100 p-b-5em'>";
                li_dati+="<h2 class='uppercase'>"+name.titolo+"</h2> <p>"+name.testo+"</p></div></div></div>";
                
            });               
            $(".swiper-wrapper").html(li_dati);          
        });
    }

}

//indoor navigation
$(document).on("pagebeforeshow", "#locali", function () { 
    if (checkInternet) {
        var elenco_indoor = "";
        var current_ID_negozio = 0;
        var i = 0;
        $.getJSON("http://magicbeep.mvclienti.com/webservices/get_indoorlocation.aspx", function (dati) {
            $.each(dati, function (i, name) {
                if (current_ID_negozio != name.ID){
                    if (current_ID_negozio != 0)
                        elenco_indoor += '</ul></div>';
                        
                    elenco_indoor += '<div class="project-info"><h2 class="uppercase">'+ name.nome +'</h2><span class="small">'+ name.citta +' ('+name.provincia+')</span></div>';
                    elenco_indoor += '<div class="post-author m-20 animated fadeinright delay-2"><div class="project-social-share">';

                    if (name.website != "")
                        elenco_indoor += '<a href="'+name.website+'" target="_blank"><i class="ion-android-globe blue-text"></i></a>';
                    if (name.facebook != "")
                        elenco_indoor += '<a href="'+name.facebook+'" target="_blank"><i class="ion-social-facebook blue-text"></i></a>';
                    if (name.twitter != "")
                        elenco_indoor += '<a href="'+name.twitter+'" target="_blank"><i class="ion-social-twitter blue-text"></i></a>';
                    if (name.googleplus != "")
                        elenco_indoor += '<a href="'+name.googleplus+'" target="_blank"><i class="ion-social-googleplus blue-text"></i></a>';
                    if (name.instagram != "")
                        elenco_indoor += '<a href="'+name.instagram+'" target="_blank"><i class="ion-social-instagram blue-text"></i></a>';
                    if (name.youtube != "")
                        elenco_indoor += '<a href="'+name.youtube+'" target="_blank"><i class="ion-social-youtube blue-text"></i></a>';
                    if (name.vimeo != "")
                        elenco_indoor += '<a href="'+name.vimeo+'" target="_blank"><i class="ion-social-vimeo blue-text"></i></a>';
                    if (name.latitudine != "")
                        elenco_indoor += '<a href="http://maps.google.com/maps?&daddr=' + name.latitudine + ',' + name.longitudine +'" target="_blank"><i class="ion-android-navigate blue-text"></i></a>';                    
                    elenco_indoor += '</div></div>';
                    
                    elenco_indoor += '<div class="m-20 comments project-comments animated fadeinup delay-3"><h3 class="uppercase">Indoor</h3><ul class="comments-list">';
                }  
                
                elenco_indoor += '<li><a href="http://magicbeep.mvclienti.com/public/upload_gallery/immagini/'+name.allegato_indoor+'"><i class="ion-android-compass blue-text avatar circle"></i> <div class="comment-body"><span class="author uppercase">'+name.titolo_indoor+'</span><p>'+name.desc_indoor+'</p><img width="100%" src="http://magicbeep.mvclienti.com/public/upload_gallery/immagini/'+name.allegato_indoor+'"></div></a></li>';
                
                current_ID_negozio = name.ID;
                  
                i++;
            });
            $("#lista_indoornavigation").html(elenco_indoor);
        }); 
    } else {
        $("#lista_indoornavigation").html("Connessione internet assente");
    }                           
});
