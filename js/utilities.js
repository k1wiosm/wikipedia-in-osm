function setupMap() {
	map = L.map('map').setView([51.505, -0.09], 13);

	L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
		}).addTo(map);

	map.on('moveend', loadData);
	loadData();
	
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
			'node["wikidata"]'+bbox+';'+
			'way["wikidata"]'+bbox+';'+
			'relation["wikidata"]'+bbox+';'+
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
		if (data.elements[i].tags) {
			var lat = data.elements[i].lat || data.elements[i].center.lat;
			var lon = data.elements[i].lon || data.elements[i].center.lon;
			var wikipedia = null;
			var wikidata = null;
			if (data.elements[i].tags.wikipedia) {
				var wikipedia = {};
				wikipedia.lang = data.elements[i].tags.wikipedia.split(':')[0];
				wikipedia.title = data.elements[i].tags.wikipedia.split(':')[1];
			}
			if (data.elements[i].tags.wikidata) {
				var wikidata = data.elements[i].tags.wikidata;
			}
			popup = 		'<a href="https://openstreetmap.org/'+
							data.elements[i].type+'/'+
							data.elements[i].id+'">'+
							data.elements[i].type+
							data.elements[i].id+'</a></br>';
			if (wikidata) {
				popup += 	'<a href="https://www.wikidata.org/wiki/'+
							wikidata+'">'+wikidata+'</a></br>';
			}
			if (wikipedia) {
				popup +=	'<a href="http://'+wikipedia.lang+
							'.wikipedia.org/wiki/'+wikipedia.title+'">'+
							wikipedia.lang+":"+wikipedia.title+'</a>';
			}
			var marker = L.circleMarker([lat, lon]).addTo(markers)
				.bindPopup(popup);
			switch (data.elements[i].type) {
				case 'node': marker.setStyle({color:'blue'}); break;
				case 'way': marker.setStyle({color:'red'}); break;
				case 'relation': marker.setStyle({color:'green'}); break;
			};
		};
	};
	markers.addTo(map);
}