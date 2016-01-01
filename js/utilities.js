function setupMap() {
	map = L.map('map').setView([51.505, -0.09], 13);

	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);

	map.on('load', loadData);
	map.on('moveend', loadData);
	
	markers = new L.FeatureGroup();
}

function queryOverpass (opt, callback) {
	if (!opt) { opt = {}; };
	if (!opt.timeout) { opt.timeout = 25; };
	var query = 
		'[out:json]' +
		'[timeout:'+opt.timeout+'];'+
		opt.query;
	console.log('QUERYING: '+query);
	if (typeof rq !== 'undefined') { rq.abort(); };
	rq = $.ajax({
		url: 'https://overpass-api.de/api/interpreter?data='+query,
		success:
		function (response) {
			if(response.remark!=undefined) { throw new Error("Timeout"); };
			callback(response);
		},
		timeout: opt.timeout*1000,
		error:
		function (jqXHR, status, errorThrown) {
			if (status=='timeout') { console.log("Timeout"); }
			else if (status=='abort') { console.log("Abort"); }
			else { console.log("Unknown error"); };
		},
	});
}

function loadData () {
	$('div#loading').show();
	var bbox = '('+
		map.getBounds().getSouth()+','+
		map.getBounds().getWest()+','+
		map.getBounds().getNorth()+','+
		map.getBounds().getEast()+')';
	var query=''+
		'('+
			'node["wikipedia"]'+bbox+';'+
			'way["wikipedia"]'+bbox+';'+
			'relation["wikipedia"]'+bbox+';'+
		');'+
		'out center 100;';
	queryOverpass({query:query}, showData);
}

function showData (data) {
	$('div#loading').hide();
	console.log(data);
	markers.clearLayers();
	for (var i = 0; i < data.elements.length; i++) {
		if (data.elements[i].tags && data.elements[i].tags.wikipedia) {
			var lat = data.elements[i].lat || data.elements[i].center.lat;
			var lon = data.elements[i].lon || data.elements[i].center.lon;
			var marker = L.circleMarker([lat, lon]).addTo(markers)
				.bindPopup(''+
					'<a href="http://openstreetmap.org/'+
					data.elements[i].type+'/'+
					data.elements[i].id+'">'+
					data.elements[i].type+
					data.elements[i].id+'</a></br>'+
					data.elements[i].tags.wikipedia+' '
					);
			switch (data.elements[i].type) {
				case 'node': marker.setStyle({color:'blue'}); break;
				case 'way': marker.setStyle({color:'red'}); break;
				case 'relation': marker.setStyle({color:'green'}); break;
			};
		};
	};
	markers.addTo(map);
}