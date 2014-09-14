// Insert your Dropbox app key here:
var DROPBOX_APP_KEY = 'sufwramlfghovn9';

// Exposed for easy access in the browser console.
var client = new Dropbox.Client({key: DROPBOX_APP_KEY});
var defaultDatastore;
var secureEntriesTable;

// Current filter for secure entries
var filterOverSecureEntries = null;
// Record id being edited
var recordIdBeginEdited = null;


// Clear the list
function clearList() {
	// Limpiar lista actual
	$('#secureEntries').empty();
}

// Rellenar lista
function replaceListWithCurrentFilter() {
	clearList();	

	// Si no hay filtro, salir
	if (filterOverSecureEntries == null || 
		filterOverSecureEntries.length == 0 ||
		secureEntriesTable == null) {
		return;
	}
	    
	if (filterOverSecureEntries.length < 3) {
		$('#secureEntries').append(
			renderCategory(i18n.t("notenoughchars")));
		$('#secureEntries').listview ("refresh");
		return;
	}

	// Obtener registros a mostrar ordenados por categoria, titulo.
	var records = secureEntriesTable.query();
	records.sort(function (taskA, taskB) {
		if (taskA.get('category') < taskB.get('category')) return -1;
		if (taskA.get('category') > taskB.get('category')) return 1;
		if (taskA.get('title') < taskB.get('title')) return -1;
		if (taskA.get('title') > taskB.get('title')) return 1;
		return 0;
	});

	var lastCategoryWritten = null;
	var recordsIn = 0;
	for (var i = 0; i < records.length; i++) {
		var record = records[i];

		// Comprobar si cumple el filtro
		if (! registroCumpleElFiltro(record)) {
			continue;		
		}
		recordsIn++;

		// Escribir la categoria cuando se encuentre por primera vez
		if (lastCategoryWritten != record.get('category')) {
			lastCategoryWritten = record.get('category');
			$('#secureEntries').append(
				renderCategory(lastCategoryWritten));				
		}

		// Escribir el registro			
		$('#secureEntries').append(
			renderSecureEntry(record.getId(),
							  record.get('title')));
	}

		// Controlar caso de no encontrar nada
	console.log("Se han encontrado %d registros para el filtro '%s'", recordsIn, filterOverSecureEntries);
	if (recordsIn == 0) {
		$('#secureEntries').append(
			renderCategory(i18n.t("nothingfound")));

	}

	// Refrescar la lista para que se construya
	$('#secureEntries').listview ("refresh");
	//$('#secureEntries').trigger( "updatelayout");	
}

// Comprueba si el registro dado cumple el filtro actual
function registroCumpleElFiltro(record) {
	var title = record.get('title');
	if (title != null &&
		title.length > 0 &&
		title.toLowerCase().indexOf(filterOverSecureEntries) != -1) {
		return true;		
	}
	
	var category = record.get('category');
	if (category != null &&
		category.length > 0 &&
		category.toLowerCase().indexOf(filterOverSecureEntries) != -1) {
		return true;		
	}
	
	//console.log("Record %s no cumple el filtro", title);
	return false;
}


// Render secure entry.
function renderSecureEntry(id, title) {
	return $('<li>')
			//.attr('id', id)
			//.addClass('secureEntry')
		.append($('<a>')
				.attr('id', id)
				.addClass('secureEntry')
				.attr('href','#editEntryPage')
				.attr('data-rel','popup')
				.attr('data-position-to','window')
				.attr('data-recordId', id)
			    .text(title)
			);
}

// Render the HTML for a category
function renderCategory(text) {
	if (text == null || text.length == 0) {
		text = i18n.t('nocategory');
	}
	return $('<li>')
		.attr('data-role', 'list-divider')
		.text(text)
		;
}

// Evento: Click sobre entradas (ver http://jsfiddle.net/Palestinian/RFv4C/)
$(document).on('pagebeforeshow', "#mainPage",function () {
    $(document).on('click', ".secureEntry",function (e) {  
    	//alert("Clicked over "+e.target.id);
		recordIdBeginEdited = e.target.id;

	    $( "#secureEntryPage" ).popup( "open");
  
        //$.mobile.changePage('second.html', { dataUrl : "second.html?paremeter=123", data : { 'paremeter' : '123' }, reloadPage : false, changeHash : true });
    });
});

/** Convert from a bitArray to an array of bytes. */
 function bytes_fromBits (arr) {
    var out = [], bl = sjcl.bitArray.bitLength(arr), i, tmp;
    for (i=0; i<bl/8; i++) {
      if ((i&3) === 0) {
        tmp = arr[i/4];
      }
      out.push(tmp >>> 24);
      tmp <<= 8;
    }
    return out;
  };
  /** Convert from an array of bytes to a bitArray. */
function  bytes_toBits (bytes) {
    var out = [], i, tmp=0;
    for (i=0; i<bytes.length; i++) {
      tmp = tmp << 8 | bytes[i];
      if ((i&3) === 3) {
        out.push(tmp);
        tmp = 0;
      }
    }
    if (i&3) {
      out.push(sjcl.bitArray.partial(8*(i&3), tmp));
    }
    return out;
  };
  
// Event: Abrir ventana de edicion
$( document ).on( "popupbeforeposition", "#editEntryPage", function(e, data) {
	$("#password").val("ID es " + recordIdBeginEdited);

	// Get the record
	var record = secureEntriesTable.get(recordIdBeginEdited);
	if (record == null) {
		return;
	}

	// Show loading...
	$.mobile.loading( 'show', {
		text: 'Loading entry...',
		textVisible: true
	});

	// Decypher payload
	var payloadCyphered = record.get('payload');
	var payloadCypheredBits = bytes_toBits(payloadCyphered);
	
	// Master password ...
	var pass = "699^g,n)9&Q5[^u6$B*Y,Lyc2!K1erhACU4PUAO6";
	
	// Decypher
	var payloadDecyphered = RNCryptor.Decrypt(pass, payloadCypheredBits, null);
	var payloadDecypheredString = sjcl.codec.utf8String.fromBits(payloadDecyphered);
	var payloadDecypheredValues = jQuery.parseJSON( payloadDecypheredString );
	
	// Hide spinner	
	$.mobile.loading('hide');
	
	// Show values
	$("#title").val(record.get('title'));
	$("#category").val(record.get('caegory'));
	$("#username").val(payloadDecypheredValues['u']);
	$("#password").val(payloadDecypheredValues['p']);
	$("#note").val(payloadDecypheredValues['n']);
	
	
});


$(function () {
	
	// Multilanguage
	i18n.init({ fallbackLng: 'en' , debug: true, getAsync: false});
	$(document).i18n();

	// Evento: nueva tecla sobre la caja de busqueda
	$('#filterInput').keyup(function () {
		// Actualizar el filtro a lo nuevo escrito por el usuario
		filterOverSecureEntries = $('#filterInput').val().toLowerCase();
		replaceListWithCurrentFilter();
	});

	// Evento: click sobre boton de limpiar caja de busqueda
	$('.ui-content').on('click', '.ui-input-clear', function(e){
		// Borrar el filtro
		filterOverSecureEntries = null;
   		clearList();
	}) ;
	
	// Insert a new task record into the table.
	function insertTask(text) {
		secureEntriesTable.insert({
			taskname: text,
			created: new Date(),
			completed: false
		});
	}

	// updateList will be called every time the table changes.
	function updateList() {
		
		
		
		//$('#secureEntries').empty();
		$('#mtime').empty();
		var mtime = defaultDatastore.getModifiedTime();
		if (mtime)
			$('#mtime').text('Last modified time: ' + mtime);

		var records = secureEntriesTable.query();

		// Sort by category then by title.
		records.sort(function (taskA, taskB) {
			if (taskA.get('category') < taskB.get('category')) return -1;
			if (taskA.get('category') > taskB.get('category')) return 1;
			if (taskA.get('title') < taskB.get('title')) return -1;
			if (taskA.get('title') > taskB.get('title')) return 1;
			return 0;
		});

		// Add an item to the list for each task.
		var lastCategoryWritten = null;
		for (var i = 0; i < records.length; i++) {
			var record = records[i];
			
			// Escribir la categoria cuando se encuentre por primera vez
			if (lastCategoryWritten != record.get('category')) {
				lastCategoryWritten = record.get('category');
				$('#secureEntries').append(renderCategory(lastCategoryWritten));				
			}
			
			// Escribir el registro			
			$('#secureEntries').append(
				renderTask(record.getId(),
					0, //record.get('entryFlags'),
					record.get('title')));
		}
		$('#secureEntries').listview ("refresh");
		$("#secureEntries").listview( "option", "filterPlaceholder", "Search..." );

		addListeners();
		$('#filterInput').focus();
	}

	// The login button will start the authentication process.
	$('#loginButton').click(function (e) {
		e.preventDefault();
		// This will redirect the browser to OAuth login.
		client.authenticate();
	});

	// Try to finish OAuth authorization.
	client.authenticate({interactive:false}, function (error) {
		if (error) {
			alert('Authentication error: ' + error);
		}
	});

	if (client.isAuthenticated()) {
		// Client is authenticated. Display UI.
		$('#loginButton').hide();
		$('#main').show();

		client.getDatastoreManager().openDefaultDatastore(function (error, datastore) {
			if (error) {
				alert('Error opening default datastore: ' + error);
				return;
			}

			$(window).bind('beforeunload', function () {
				if (datastore.getSyncStatus().uploading) {
					return "You have pending changes that haven't been synchronized to the server.";
				}
			});
			$('#status').text('Synchronized');
			var previouslyUploading = false;
			datastore.syncStatusChanged.addListener(function () {
				var uploading = datastore.getSyncStatus().uploading;
				if (previouslyUploading && !uploading) {
					$('#status').text('Last sync: ' + new Date());
				}
				previouslyUploading = uploading;
			});

			defaultDatastore = datastore;
			secureEntriesTable = datastore.getTable('SecureEntry');

			// Populate the initial task list.
			//updateList();

			// Ensure that future changes update the list.
			datastore.recordsChanged.addListener(replaceListWithCurrentFilter);
		});
	}

	// Set the completed status of a task with the given ID.
	function setCompleted(id, completed) {
		secureEntriesTable.get(id).set('completed', completed);
	}

	// Delete the record with a given ID.
	function deleteRecord(id) {
		secureEntriesTable.get(id).deleteRecord();
	}

	// Render the HTML for a single task.
	function renderTask(id, completed, text) {
		return $('<li>').attr('recordId', id).append(
					$('<a>').attr('href','#').text(text)
				);
	}

	// Register event listeners to handle completing and deleting.
	function addListeners() {
		$('span').click(function (e) {
			e.preventDefault();
			var li = $(this).parents('li');
			var id = li.attr('id');
			setCompleted(id, !li.hasClass('completed'));
		});

		$('button.delete').click(function (e) {
			e.preventDefault();
			var id = $(this).parents('li').attr('id');
			deleteRecord(id);
		});
	}

	// Hook form submit and add the new task.
	$('#addForm').submit(function (e) {
		e.preventDefault();
		if ($('#newTask').val().length > 0) {
			insertTask($('#newTask').val());
			$('#newTask').val('');
		}
		return false;
	});

	$('#filterInput').focus();
});
