var prova;
var countUno = 0;
var countDue = 0;
var countTre = 0;
var uuid = new String();
var millisecondi = 0;
var provaIDNotifica;
// Variabili globali per la selezione una tantum dei diversi beacon


//sessionStorage.getItem('id');
var app = (function()
{
    
    // Varibile che serve per il controllo del bluetooth all' apertura dall' app
	var ble = null;
	// Application object.
	var app = {};

    app.scanInterval = 5000;
	app.isScanning = false;
	app.lastScanEvent = 0;
    
	// Inizializzo matrice
	var matrice_notizie = new Array();
    if(JSON.parse(localStorage.getItem("matrice_notizie")) == null){
		
	}else{
        matrice_notizie  = JSON.parse(localStorage.getItem("matrice_notizie"));
	}

	// Dichiaro regions per trovare beacon in dinamico  
     var regions = [];
	
	// Background detection.
	var notificationID = 0;
	var inBackground = false;
	document.addEventListener('pause', function() { inBackground = true });
	document.addEventListener('resume', function() { inBackground = false });

	// Dictionary of beacons.
	var beacons = {};

	// Timer that displays list of beacons.
	var updateTimer = null;

	app.initialize = function()
	{
		document.addEventListener(
			'deviceready',
			function() { evothings.scriptsLoaded(onDeviceReady) },
			false);
	};



	function onDeviceReady()
	{
		// Parte l' onDeviceReady
		//Popolo la tebella notizie direttamente scaricate dal server se c'è la connessione
		if(checkInternet()){
			// Creazione delle tabelle del db 
			db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);
			db.transaction(
				// Metodo di chiamata asincrona
				function(tx) {
					tx.executeSql("DROP TABLE IF EXISTS notizie ");
					tx.executeSql("CREATE TABLE IF NOT EXISTS notizie (ID INTEGER PRIMARY KEY,data, titolo, descrizione, immagine, link, allegato, user, stato, data_creazione, attivo_da, attivo_a, ultima_modifica, ID_dispositivo)");
				
					//tx.executeSql("DROP TABLE IF EXISTS notifiche");
					tx.executeSql("CREATE TABLE IF NOT EXISTS notifiche (id INTEGER PRIMARY KEY AUTOINCREMENT,uuid, data_ora datetime, ID_dispositivo, ID_notizia, tipologia, ID_utente)");
				
					tx.executeSql("DROP TABLE IF EXISTS dispositivi ");
					tx.executeSql("CREATE TABLE IF NOT EXISTS dispositivi (ID INTEGER PRIMARY KEY ,uuid, major, minor, nome, stato)");
				},
				function () {
					alert("Errore"+e.message);
				},
				function(){
					//  alert("Creazione tabella notizie");
				}
			)
			// Fine della creazione delle tabella db 
			
			//sincronizzo notizie ogni minuto
			sincronizza_notizie();
			sinc = setInterval(sincronizza_notizie,20000);
		} else{
			  //Seleziono notizie da db interno
		}

		// Per il login anche dopo la chiusura dell' applicazione, la prima volta'
		if(localStorage.getItem('login')==null)
		{
			  localStorage.setItem('login', false);
		}

		 
		 // Controllo se bluetooth è accesso
	     ble = evothings.ble;
		 app.startLeScan();
		 // Fine controllo bluetooth acceso


		window.locationManager = cordova.plugins.locationManager;
	    cordova.plugins.notification.local.registerPermission(function (granted) {
			// console.log('Permission has been granted: ' + granted);
		});		
		// Funzione che  inizia la ricerca dei beacon
		startScan();
		// Display refresh timer.
		//updateTimer = setInterval(displayBeaconList, 500);

		$('#scan_read').click( function() 
        {
			cordova.plugins.barcodeScanner.scan(
			function (result) {
				alert("We got a barcode\n" +
						"Result: " + result.text + "\n" +
						"Format: " + result.format + "\n" +
						"Cancelled: " + result.cancelled);            
			}, 
			function (error) {
				alert("Scanning failed: " + error);
			});
			}
		);
	}

function sincronizza_notizie(){
	if(checkInternet()){
		// Prelevo dati dal server e salvo nel db
		$.getJSON("http://magicbeep.mvclienti.com/webservices/sync_notizie.aspx", function (dati) {
			var li_dati = "";
			$.each(dati, function (i, name) {
				// Inserisco dati nel db sqllite dell' App

				db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);
				db.transaction(
					// Metodo di chiamata asincrona
					function(tx) {
						tx.executeSql("INSERT INTO notizie (ID,data, titolo, descrizione, immagine, link, allegato, user, stato, data_creazione, attivo_da, attivo_a, ultima_modifica, ID_dispositivo) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",[name.ID,name.data,name.titolo,name.descrizione,name.immagine,name.link,name.allegato,name.user,name.stato,name.data_creazione,name.attivo_da,name.attivo_a,name.ultima_modifica,name.ID_dispositivo]);
					
						
						// carico in notifiche le notizie extra non collegate ai dispositivi
						
						if (name.ID_dispositivo == null || name.ID_dispositivo == ""){
							if (!checkNotizia("",name.ID)){
								var date;
									date = new Date();
									date = date.getFullYear() + '-' +
									('00' + (date.getMonth() + 1)).slice(-2) + '-' +
									('00' + date.getDate()).slice(-2) + ' ' +
									('00' + date.getHours()).slice(-2) + ':' +
									('00' + date.getMinutes()).slice(-2) + ':' +
									('00' + date.getSeconds()).slice(-2);  
								tx.executeSql("INSERT INTO notifiche (data_ora, ID_notizia,tipologia) VALUES (?,?,?)",[date,name.ID,"extra"]);
							
								if (inBackground)
									pushNotifica(name.ID,name.titolo,"extra");
								else
									popNotifica(name.ID,name.titolo,"extra");
							
						}
					}

					},
					function () {
						alert("Errore"+e.message);
					},
					function(){
							//alert("Inserimento effettuato tabelle notizie");
					}
				)
			});		
		});
	}
}
// Funzioni per il controllo del bluetooth all' avvio della applicazione
app.startLeScan = function()
{
	app.stopLeScan();
	app.isScanning = true;
	app.lastScanEvent = new Date();
	//app.runScanTimer();

	ble.startScan(function(r)
	{
		//address, rssi, name, scanRecord
		if (app.knownDevices[r.address])
		{
			return;
		}
		app.knownDevices[r.address] = r;
		var res = r.rssi + " " + r.name + " " + r.address;
		console.log('scan result: ' + res);
		var p = document.getElementById('deviceList');
		var li = document.createElement('li');
		var $a = $("<a href=\"#connected\">" + res + "</a>");
		$(li).append($a);
		$a.bind("click",
			{address: r.address, name: r.name},
			app.eventDeviceClicked);
		$("#deviceList").listview("refresh");
	}, function(errorCode)
	{
		console.log('startScan error: ' + errorCode);
	});
};

app.stopLeScan = function()
{
	console.log('Stopping scan...');
	ble.stopScan();
	app.isScanning = false;
	clearTimeout(app.scanTimer);
};

app.runScanTimer = function()
{
	if (app.isScanning)
	{
		var timeSinceLastScan = new Date() - app.lastScanEvent;
		if (timeSinceLastScan > app.scanInterval)
		{
			if (app.scanTimer) { clearTimeout(app.scanTimer); }
			app.startLeScan(app.callbackFun);
		}
		app.scanTimer = setTimeout(app.runScanTimer, app.scanInterval);
	}
};
// Fine funzioni per il controllo del bluetooth all' avvio della applicazione


  

function startScan()
{
		  // Inizio scansione dei vari beacon

		  // Creazione della tabella Beacon  se c'è o non c'è internet 
		  var connessione = checkInternet();
		
		  if(connessione){
              
				// Fine della creazione delle tabella db 
				// Prelevo dati dal server e salvo nel db
				$.getJSON("http://magicbeep.mvclienti.com/webservices/sync_dispositivi.aspx", function (dati) {
                    var li_dati = "";
                    $.each(dati, function (i, name) {
                        // Inserisco dati nel db sqllite dell' App
                       db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);
                       db.transaction(
                            // Metodo di chiamata asincrona
                            function(tx) {
                            	tx.executeSql("INSERT INTO dispositivi (ID,uuid, major, minor, nome, stato) VALUES (?,?,?,?,?,?)",[name.ID,name.UUID,name.major,name.minor,name.nome,name.stato]);
                            
							            },
                             function () {
                                             alert("Errore"+e.message);
                                         },
                             function(){
                                           //alert("Inserimento dispositivi");
                                         }
                    )
                    });
					  // Funzione per la selezione dei beacon da ricercare dal db dell' app
                     selezionaBeacon ();             
                });
		  }
		  
		
		// L' oggetto delegate detiene le funzioni di callback di iBeacon plugin 
		// Dichiarato di seguito.
		var delegate = new locationManager.Delegate();
		
		// Richiamato di continuo per cercare i Beacon nei paraggi, viene eseguita subito dopo il ciclo for 'Inizio monitoraggio dei beacon che vanno cercati' scritto nella funzione successoSelezione
		delegate.didRangeBeaconsInRegion = function(pluginResult)
		{
		
			//alert('didRangeBeaconsInRegion: ' + JSON.stringify(pluginResult));
            
			for (var i in pluginResult.beacons)
			{
				// Se trova il Beacon lo inserisce nella var beacon.
				// Faccio partire beep o vibrazione
				var beacon = pluginResult.beacons[i];
				beacon.timeStamp = Date.now();
				// key, la chiave identifica
				// Queto if permette di idetificare il Beacon a seconda della distanza
				uuid =  beacon.uuid;
				
				proximity = beacon.proximity;
				idUUID =uuid.toUpperCase();
				var ID_dispositivo=0, ID_notizia = 0;
				var titolo_n,descrizione,immagine_n,link_n,allegato_n,attivo_da_n,attivo_a_n,data_creazione_n;
				var restituito=true;
				// Parte per rilevare o non rilevare il Beacon, ovvero se è già stato rilevato ed ha già mostrato la notizia
				// Select tra dispositivi e notizie
				
				db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);
				db.transaction(
					function(tx)
					{
						
               			tx.executeSql("SELECT N.ID as ID_notizia, titolo, descrizione,immagine,link,allegato,attivo_da,attivo_a,data_creazione, D.ID as ID_dispositivo FROM dispositivi as D,notizie as N WHERE D.uuid=? AND D.id=N.ID_dispositivo AND N.attivo_da<= datetime('now','localtime') AND N.attivo_a>=datetime('now','localtime')",[idUUID], 
			   			function(tx,dati)
			   			{
				 			var len = dati.rows.length;
							 
        					var li_dati="";
       						if(len!=0)
        					{
								titolo_n = dati.rows.item(0).titolo;
								descrizione_n = dati.rows.item(0).descrizione;
								immagine_n = dati.rows.item(0).immagine;
								link_n = dati.rows.item(0).link;
								allegato_n = dati.rows.item(0).allegato;
								attivo_da_n = dati.rows.item(0).attivo_da;
								attivo_a_n = dati.rows.item(0).attivo_a;
								data_creazione_n = dati.rows.item(0).data_creazione;
								ID_dispositivo= dati.rows.item(0).ID_dispositivo;
								ID_notizia = dati.rows.item(0).ID_notizia;	
								notiziaEsistente=checkNotizia(ID_dispositivo,ID_notizia);
								
								if(!notiziaEsistente)
								{
								  
									if (inBackground){
									  // notifica push
						              pushNotifica(ID_notizia,titolo_n,"dispositivo");
																							
												
							     	}
									 
								    
									
									// Creazione data ora, per db sul server 
									var date = new Date();
									date = date.getFullYear() + '-' +
									('00' + (date.getMonth() + 1)).slice(-2) + '-' +
									('00' + date.getDate()).slice(-2) + ' ' +
									('00' + date.getHours()).slice(-2) + ':' +
									('00' + date.getMinutes()).slice(-2) + ':' +
									('00' + date.getSeconds()).slice(-2);  
									// Fine creazione data_ora
									// Inserisco notizie nella tabella notifche per Beacon Azzurro 
									db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);
									db.transaction(
										// Metodo di chiamata asincrona
										function(tx) {
											// Se loggato o se non loggato
											if(localStorage.getItem('login')=='true')
											{
												tx.executeSql("INSERT INTO notifiche (uuid, data_ora, ID_dispositivo, ID_notizia,tipologia,ID_utente) VALUES (?,?,?,?,?,?)",[uuid,date,ID_dispositivo,ID_notizia,'dispositivo',localStorage.getItem('Id_login')]);
											}else{
												tx.executeSql("INSERT INTO notifiche (uuid, data_ora,ID_dispositivo, ID_notizia,tipologia) VALUES (?,?,?,?,?)",[uuid,date,ID_dispositivo,ID_notizia,'dispositivo']); 
											}
												
										},
										function()  {
											alert("Inserimento non  effettuato"+e.message);
										},
										function()  {
											// $.mobile.navigate("#Notifica"); 
											popNotifica(ID_notizia,titolo_n,"dispositivo");
											
											
										}
									)
								}

                               
								salvaLettura(proximity,ID_dispositivo,ID_notizia);
        			       }
			   		    },erroreSelezione); 
 				});
			
				
			}
		};

		// Called when starting to monitor a region.
		// (Not used in this example, included as a reference.)
		delegate.didStartMonitoringForRegion = function(pluginResult)
		{
			//alert('didStartMonitoringForRegion:' + JSON.stringify(pluginResult))
		};

		// Called when monitoring and the state of a region changes.
		// If we are in the background, a notification is shown.
		delegate.didDetermineStateForRegion = function(pluginResult)
		{
		  
			
		};

		// Set the delegate object to use.
		locationManager.setDelegate(delegate);

		// Request permission from user to access location info.
		// This is needed on iOS 8.
		locationManager.requestAlwaysAuthorization();

		// Inizio monitoraggio dei beacon che vanno cercati: questa è commentata perchè funziona con la ricerca regions dei beacon statici.
        
	/*	for (var i in regions)
		{
			//alert("Partenza regions");
			//alert(regions[i].uuid);
			var beaconRegion = new locationManager.BeaconRegion(
				i + 1,
				regions[i].uuid);

			// Start ranging.
			locationManager.startRangingBeaconsInRegion(beaconRegion)
				.fail(console.error)
				.done();

			// Start monitoring.
			// (Not used in this example, included as a reference.)
			locationManager.startMonitoringForRegion(beaconRegion)
				.fail(console.error)
				.done();
		}*/
		
}

 
	function checkInternet() 
 {
    
     var online = window.navigator.onLine;
            if (online) {
                return true;
            } else {
                return false;
            }
  }

function salvaLettura (proximity,dispositivo,notizia)
{
      var datiInviare,urlCorretto;
	  var online = window.navigator.onLine;
	  if(online==true)
	  {
		if(localStorage.getItem('Id_login')!=null)
		{
			 datiInviare = '{proximity:"'+proximity+'",Id_dispositivo:"'+dispositivo+'",Id_notizia:"'+notizia+'",Id_utente:"'+localStorage.getItem('Id_login')+'"}';
			urlCorretto = 'http://magicbeep.mvclienti.com/webservices/CS_aggiungiLettura.aspx/letturaUtente';
		}else{
		    datiInviare = '{proximity:"'+proximity+'",Id_dispositivo:"'+dispositivo+'",Id_notizia:"'+notizia+'"}';
			urlCorretto = 'http://magicbeep.mvclienti.com/webservices/CS_aggiungiLettura.aspx/lettura';
		}
	
		$.ajax({
        type: "POST",
		data: datiInviare,
		url: urlCorretto,
        contentType: "application/json; charset=utf-8",
        dataType: 'json',
		success: function(data){
		//console.log(data);
        var ritorno = data.d;
		 //  alert('Cliente Salvato'+ritorno);
            
         //   alert(uriImmagine);
         
          //     $("#pop").click();

		},
		error: function(e){
			//console.log(data);
			//alert('Errore lettura'+e.status);
            //alert('Errore2'+e.statusTest);
		}
     	});
	  }else{
		  salvaLettura (proximity,dispositivo,notizia);
	  }
	     			
}



    function checkNotizia(ID_dispositivo,ID_notizia)
	{
		
		var matrice_len = matrice_notizie.length;
	    var  trovato = false;
		if(matrice_len > 0){
			current_id_disp = 0;
			current_id_not = 0;
            for (var i=0; i < matrice_notizie.length; i++) {
				current_id_disp = matrice_notizie[i][0];
				current_id_not = matrice_notizie[i][1];
				
				if(current_id_disp== ID_dispositivo && current_id_not==ID_notizia)
				{
				
					trovato = true;
				}	
			}
		 } else {
			//alert("Carica il primo id dispositivo e notifica");
			matrice_notizie[0] = new Array();
			matrice_notizie[0][0]=ID_dispositivo;
			matrice_notizie[0][1]=ID_notizia;
			//alert(matrice_len + ' - disp:'+ ID_dispositivo + ' - ' + matrice_notizie[0][0] + ' - ' + matrice_notizie[0][1]);
		}

		if (!trovato){
			matrice_notizie[matrice_len] = new Array();
			matrice_notizie[matrice_len].push(ID_dispositivo,ID_notizia);
			localStorage.setItem("matrice_notizie", JSON.stringify(matrice_notizie));
		}
	
		return trovato;
	   
	}

	function onConfirm(buttonIndex) {
	
	if(buttonIndex==1)
	{
		//alert("Stai guardando la notizia")
		localStorage.setItem('Id_notifica', provaIDNotifica);
		 $( ":mobile-pagecontainer" ).pagecontainer( "change", "#Notifica", {    transition: "flip", reload:false } );
		 
	}else{
		//alert("Stai salvando la notizia");
	
	}
}

 function selezionaBeacon ()
   {
	     
	     db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);
         db.transaction(selezione,successoSelezione);     
   }

   function selezione(tx)
   {
       tx.executeSql("SELECT * FROM dispositivi ORDER BY id ASC",[], successoSelezione,erroreSelezione);        
   }

   function erroreSelezione ()
   {
	   //alert("Errore selezione");
   }

   function successoSelezione(tx,dati)
   {
    var len = dati.rows.length;
	
        var li_dati="";
        if(len!=0)
        {
            
             for(var i=0; i<len; i++)
            {
				// popolo l' array associativo regions che mi permette di ricercare i beacon scaricati dal server e salvati nel db locale dell' app 
				regions.push({
					uuid: dati.rows.item(i).uuid
				});
            }
			//Inizio monitoraggio dei beacon che vanno cercati
			for (var i in regions)
			{
	
				var beaconRegion = new locationManager.BeaconRegion(
				i + 1,
				regions[i].uuid);

				// Start ranging.
				locationManager.startRangingBeaconsInRegion(beaconRegion)
				.fail(console.error)
				.done();

				// Start monitoring.
				// (Not used in this example, included as a reference.)
				locationManager.startMonitoringForRegion(beaconRegion)
				.fail(console.error)
				.done();
			}   
        }
      
    }
// Continuare selezione	
/*			
 function selezionaDispositiviNotizie (idUUID)
   {
	  
	    db = window.openDatabase("DatabaseSqlliteApp", "1.0", "Magicbeep", 200000);
		db.transaction(
			function(tx)
			{
               tx.executeSql("SELECT N.ID as ID_notizia, D.ID as ID_dispositivo FROM dispositivi as D,notizie as N WHERE D.uuid=? AND D.id=N.ID_dispositivo",[idUUID], 
			   function(tx,dati)
			   {
				 	var len = dati.rows.length;
        			var li_dati="";
       				if(len!=0)
        			{
					ID_dispositivo= dati.rows.item(0).ID_dispositivo;
					ID_notizia = dati.rows.item(0).ID_notizia;
                	alert("ID_Dispositivo"+ID_dispositivo);
			    	alert("ID_notiiza"+ID_notizia);
        			}
			   },//successoSelezioneDisp,
			   erroreSelezione); 
 			});
       /*var valori =  db.transaction(
			  // Metodo di chiamata asincrona
                            function(tx) {
                                            tx.executeSql("SELECT N.ID as ID_notizia, D.ID as ID_dispositivo FROM dispositivi as D,notizie as N WHERE D.uuid=? AND D.id=N.ID_dispositivo",[idUUID], function(tx, result)  {
                                           
											return rresult.rows.item[0].ID_dispositivo;
                                         });
                                         }

		 );  
		  alert("Inserimento effettuato"+valori);
		/* selezionaID("SELECT N.ID as ID_notizia, D.ID as ID_dispositivo FROM dispositivi as D,notizie as N WHERE D.uuid='"+idUUID+"' AND D.id=N.ID_dispositivo", function(dati) {
              alert(dati);
     
   		});  */ 
  // }

  /* function selezioneDisp(tx,idUUID)
   {
	   alert(idUUID);
       tx.executeSql("SELECT N.ID as ID_notizia, D.ID as ID_dispositivo FROM dispositivi as D,notizie as N WHERE D.uuid=? AND D.id=N.ID_dispositivo",[idUUID], successoSelezioneDisp,erroreSelezione);        
   }
*/


  /* function successoSelezioneDisp(tx,dati)
   {
    var len = dati.rows.length;
        var li_dati="";
        if(len!=0)
        {
            
            
				ID_dispositivo= dati.rows.item(0).ID_dispositivo;
				ID_notizia = dati.rows.item(0).ID_notizia;
                alert("ID_Dispositivo"+ID_dispositivo);
			    alert("ID_notiiza"+ID_notizia);
			
        }
      
    }*/
	

	function displayBeaconList()
	{
		// Clear beacon list.
		$('#found-beacons').empty();

		var timeNow = Date.now();
		// Update beacon list.
		$.each(beacons, function(key, beacon)
		{
			
			// Only show beacons that are updated during the last 60 seconds.
			if (beacon.timeStamp + 60000 > timeNow)
			{
				
				// Map the RSSI value to a width in percent for the indicator.
				var rssiWidth = 1; // Used when RSSI is zero or greater.
				if (beacon.rssi < -100) { rssiWidth = 100; }
				else if (beacon.rssi < 0) { rssiWidth = 100 + beacon.rssi; }

				// Create tag to display beacon data.
				var element = $(
					'<li>'
					+	'<strong>UUID: ' + beacon.uuid + '</strong><br />'
					+	'Major: ' + beacon.major + '<br />'
					+	'Minor: ' + beacon.minor + '<br />'
					+	'Proximity: ' + beacon.proximity + '<br />'
					+	'RSSI: ' + beacon.rssi + '<br />'
					+	'Precisione: ' + beacon.accuracy + '<br />'
					+ 	'<div style="background:rgb(255,128,64);height:20px;width:'
					+ 		rssiWidth + '%;"></div>'
					+ '</li>'
				);
                $('.noBeacon').remove();
				//$('#warning').remove();
				//$('#found-beacons').append(element);
			}
		});
	}


	function pushNotifica(ID_notifica,titolo,tipologia){
		cordova.plugins.notification.local.schedule(
		{
			id: ID_notifica,
			title: 'MagicBeep',
			text: titolo+', continua a leggere'		
		});
		cordova.plugins.notification.badge.increase();
		cordova.plugins.notification.local.on("click", function (notification) {
				localStorage.removeItem("Id_notifica");
				localStorage.setItem('Id_notifica', notification.id);
				$( ":mobile-pagecontainer" ).pagecontainer( "change", "#notifica", {    transition: "flip", reload:false } );
		});

			
		
		
	}
	function popNotifica(ID_notifica,titolo,tipologia){
		if(!inBackground)
		{
			var data = new Date();
			data = ('00' + data.getDate()).slice(-2) + "/" + ('00' + (data.getMonth() + 1)).slice(-2) + "/" + data.getFullYear() + " " + ('00' + data.getHours()).slice(-2) + ":" + ('00' + data.getMinutes()).slice(-2);

			var popNotifica = "";
			popNotifica+="<div id="+ID_notifica+" class='notification notification-info box_notifica box_notifica_"+tipologia+"'>";
			popNotifica+="<button onclick='salvaNotifica("+ID_notifica+")'  class='close-notification no-smoothState'><i  class='ion-android-close'></i></button>";
			popNotifica+="<div  class='allargaNot' onclick='apriNotifica("+ID_notifica+")' ><p>"+titolo+"</p>";
			popNotifica+="<span>"+ data +"</span></div></div>";
			
			$(".container_page").append(popNotifica);

			navigator.notification.beep(1);
			navigator.vibrate(3000);
		}
	}

	return app;
})();

app.initialize();

