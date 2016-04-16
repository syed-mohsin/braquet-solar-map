function getDate() {
    var months = ["January", "February", "March", "April", "May", "June",
                  "July", "August", "September", "October", "November", "December"];
    var d = new Date();
    var month = months[d.getMonth()];
    var year = d.getFullYear();
    var day = d.getUTCDate();

    return month + " " + day + ", " + year;
}

function drawChart() {
    var selected_polygon = getSelectedPolygon();
    var energyProduction = selected_polygon.energyProduction;

    var data = new google.visualization.arrayToDataTable([
        ['Month', 'Energy Production (kWh)'],
        ['January', energyProduction[0]],
        ['February', energyProduction[1]],
        ['March', energyProduction[2]],
        ['April', energyProduction[3]],
        ['May', energyProduction[4]],
        ['June', energyProduction[5]]
    ]);

    var options = {
        title: "Solar Power Output on " + getDate(),
        legend: 'none'
    }

    var chart_canvas = document.createElement('canvas');
    chart_canvas.width = 300;
    chart_canvas.height = 300;

    var ctx = chart_canvas.getContext('2d');

    var chart = new google.visualization.ColumnChart(chart_canvas);

    // save google map screenshot for email report once it is ready
    google.visualization.events.addListener(chart, 'ready', function() {
        MYLIBRARY.setChartImg(chart.getImageURI());
        canvas = null; // delete DOM
    })

    chart.draw(data, options);
}

function getEnergyProduction(polygon, callback) {
    $.ajax({
        type : "POST",
        url  : "/nrel",
        data : JSON.stringify({"lat"      : polygon.latlngCenter.lat(),
                               "lng"      : polygon.latlngCenter.lng(),
                               "tilt"     : polygon.tiltValue, 
                               "azimuth"  : polygon.azimuthValue,
                               "capacity" : polygon.systemCapacity}, 
                               null, '\t'),
        contentType: 'application/json; charset=UTF-8',
        success: function (result) {
            callback(result);
        }
    })
}

function CenterControl(controlDiv, map) {
    var controlUI = document.createElement('div');
    controlUI.id = 'control';
    controlUI.style.backgroundColor = '#fff';
    controlUI.style.border = '2px solid #fff';
    controlUI.style.borderRadius = '3px';
    controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
    controlUI.style.padding = '10px';
    controlUI.style.textAlign = 'left';
    controlUI.innerHTML = '<a data-toggle="collapse" href="#collapse1"><h5>Project Settings<span class="caret" style="margin-left:5px;"></span></h5></a>';
    controlDiv.appendChild(controlUI);

    var selectPanel = document.createElement('select');
    selectPanel.className = 'form-control';
    selectPanel.id = 'panel_specs';

    //creates dropdown for different pv panels

    var panel_specs = MYLIBRARY.getPanelSpecs();
    for(var i=0;i<panel_specs["panels"].length;i++) {
        var p = panel_specs["panels"][i];
        var optionPanel = document.createElement('option');
        optionPanel.innerHTML = p['model_name'];
        optionPanel.value = p['id'];
        optionPanel.id = p['model_name'];
        optionPanel.setAttribute('data-wattage', p['wattage']);
        optionPanel.setAttribute('data-length', p['length']);
        optionPanel.setAttribute('data-width', p['width']);
        selectPanel.appendChild(optionPanel);
    }

    // Set CSS for the control interior.
    var controlText = document.createElement('div');
    controlText.id = 'collapse1';
    controlText.className = 'panel-collapse collapse in';
    controlText.style.color = 'rgb(25,25,25)';
    controlText.style.fontSize = '11px';
    controlText.style.lineHeight = '10px';
    controlText.style.paddingLeft = '5px';
    controlText.style.paddingRight = '5px';
    controlText.innerHTML = '<div id="projectStats"></div>';   
    controlText.innerHTML += '<input style="margin-top:15px;" class="form-control" id ="azimuth" type="text" placeholder="Azimuth (0-360 deg)">';            
    controlText.innerHTML += '<input class="form-control" id ="tilt" type="text" placeholder="Tilt (0-90 deg)">';
    controlText.innerHTML += '<input class="form-control" id ="rowSpace" type="text" placeholder="Row space (>1 ft)">';
    controlText.innerHTML += '<select class="form-control" id="orientation"><option value="portrait" selected>Portrait</option><option value="landscape">Landscape</option></select>';
    
    controlText.appendChild(selectPanel);
    controlUI.appendChild(controlText);

    // FOR DEMO
    if (MYLIBRARY.getIsDemo()) {
        controlText.innerHTML += '<div class="action">\
                                    <div id="submit">\
                                        <button class="braquet-btn" id="update">Update</button>\
                                    </div>\
                                    <div id="quote">\
                                        <button class="braquet-btn" id="quotebtn" onclick="quote()">Get a Quote</button>\
                                    </div>\
                                    <div id="email">\
                                        <button class="braquet-btn" id="sendemail">Email Report</button>\
                                    </div>\
                                  </div>\
                                  <img id="loading_gif" src="/static/images/loading.gif" height="25" width="275" style="display:none;"/>\
                                  <div id="email_success" style="color:#3c763d;display:none;">Email Report Sent!</div>\
                                  <div id="bidDisplay">\
                                        <div style="display:block; color:black; float:left;margin-right:10px; ">Top Bidder - </div>\
                                        <div id="bid1"></div>\
                                        <div id="bid2">  Finding suppliers...</div>\
                                        <div id="bid3">  Ying Li: $0.82 per watt</div>\
                                        <div id="bid4">  Lightway: $0.65 per watt</div>\
                                        <div id="bid5">  SunPower: $0.63 per watt</div>\
                                        <div id="bid6" style="color:#3c763d"> You got a panel supplier!</div>\
                                        <div id="bid7">\
                                            <img style="margin-top:5px" src="/static/images/logo-sunpower.jpg"><br>\
                                            <img src="/static/images/sunpower-panel.jpg">\
                                        </div>\
                                  </div>'
    } else {

    //live project settings html
        controlText.innerHTML += '<div class="action">\
                                    <div id="submit">\
                                        <button class="braquet-btn" id="update" style="width:100%">Update</button>\
                                    </div>\
                                    <div id="polygon">\
                                        <button class="braquet-btn" id="draw" style="width:49%; float:left;">Draw</button>\
                                        <button class="braquet-btn" id="keepout" style="width:49%">Keepout</button>\
                                    </div>\
                                    <div id="email">\
                                        <button class="braquet-btn" id="sendemail">Email Report</button>\
                                    </div>\
                                  </div>\
                                  <img id="loading_gif" src="/static/images/loading.gif" height="25" width="275" style="display:none;"/>\
                                  <div id="email_success" style="color:#3c763d;display:none;">Email Report Sent!</div>'
            }
    }

// courtesy of Stack Overflow question # 2956966
// executes a function at a specified interval X times
function setIntervalX(callback, delay, repetitions) {
    var x = 0;
    var intervalID = setInterval(function () {
        callback();

        if (++x === repetitions) {
            clearInterval(intervalID);
        }
    }, delay);
}

function quote() {
    document.getElementById('bidDisplay').style.display = 'inherit';

    var id = ['bid1', 'bid2', 'bid3', 'bid4', 'bid5', 'bid6', 'bid7'];
    for (var i=0;i<id.length;i++) 
        document.getElementById(id[i]).style.display = 'none';


    document.getElementById(id[5]).style.display = 'none';
    document.getElementById(id[1]).className = 'appear';

    var count = 0;
    // begin animation
    setIntervalX(function () {
        count++;
        console.log(id[count]);
        if (count != 6)
            document.getElementById(id[count - 1]).style.display = 'none';
        document.getElementById(id[count]).className = '';
        document.getElementById(id[count]).style.display = 'inherit';
        if (count == 5) {
            document.getElementById(id[count]).className = 'green';
            document.getElementById(id[count + 1]).style.display = 'inherit';
        } else {
            document.getElementById(id[count]).className = 'appear';
        }
    }, 2000, id.length-1);
}


function sendEmailReportListener() {
    // listener for email report button click
    document.getElementById('sendemail').onmousedown = function(){
        console.log("email button clicked");
        var selected_polygon = getSelectedPolygon();

        // there is no selected polygon
        if (selected_polygon == null)
            return;

        var current_bounds = map.getBounds();
        // zoom into polygon
        setZoomOnPolygon(selected_polygon);
        var updated_bounds = map.getBounds();

        // bounds did not change after zoom
        if (current_bounds === updated_bounds) {
            sendEmail(selected_polygon)
            return;
        }

        listener = google.maps.event.addListenerOnce(map, 'idle', function(event) {
            console.log("made it past idle");
            sendEmail(selected_polygon);
        });

        setTimeout(function() { google.maps.event.removeListener(listener)}, 2000);
    };
}

function sendEmail(selected_polygon) {
    // begin loading animation
    $('#loading_gif').show();
    google.charts.setOnLoadCallback(drawChart);

    // http://stackoverflow.com/questions/24046778/html2canvas-does-not-work-with-google-maps-pan
    // stack overflow solution to take a screenshot of googlemaps
    var transform=$(".gm-style>div:first>div").css("transform")
    var comp=transform.split(",") // split up the transform matrix
    var mapleft=parseFloat(comp[4]) // get left value
    var maptop=parseFloat(comp[5]) // get top value
    $(".gm-style>div:first>div").css({ //get the map container. not sure if stable
        "transform": "none",
        "left": mapleft,
        "top": maptop,
    })

    // send email report after the canvas image generated has been rendered
    html2canvas(document.getElementById(MYLIBRARY.getMapId()),
    {
        useCORS: true,
        onrendered: function(canvas)
        {   
            dataUrl = canvas.toDataURL('image/png');
            $(".gm-style>div:first>div").css({
                left:0,
                top:0,
                "transform": transform
            });

            $.ajax({
                type : "POST",
                url  : "/sendEmailReport",
                data : JSON.stringify({"screenshot" : dataUrl,
                                       "chart"      : MYLIBRARY.getChartImg(),
                                       "energy"     : selected_polygon.energyProduction,
                                       "numPanels"  : selected_polygon.numPanels,
                                       "panelType"  : selected_polygon.panelType}, 
                                       null, '\t'),
                contentType: 'application/json; charset=UTF-8',
                success: function (result) {
                    if (result === "success") {
                        console.log("success");
                        // hide loading animation and show email success message
                        $('#loading_gif').hide();
                        $('#email_success').show();

                        setTimeout(function () {
                            $('#email_success').fadeOut();
                        }, 7000);

                    }
                    else
                        console.log(result);
                }
            });
        }
    });
}

function drawButtonListener(draw) {
    // create click listener for draw
    google.maps.event.addDomListener(document.getElementById('draw'), 'click', function() {
        // set drawing mode to draw
        MYLIBRARY.setDrawingModeDraw();
        // first clear current drawing mode
        draw.setDrawingMode(null);
        // set drawing type of draw
        draw.setOptions({
            drawingMode: google.maps.drawing.OverlayType.POLYGON,
            polygonOptions: {
            fillColor: 'yellow',
            strokeColor: 'yellow',
            editable: true,
            draggable: false
            }
        });
    });
}

function keepoutButtonListener(draw) {
    // create click listener for keepouts
    google.maps.event.addDomListener(document.getElementById('keepout'), 'click', function() {
        if (getSelectedPolygon() == null)
            return;
        // set drawing mode to keepout
        MYLIBRARY.setDrawingModeKeepout();
        // first clear current drawing mode
        draw.setDrawingMode(null);
        // set drawing type for keepout
        draw.setOptions({
            drawingMode: google.maps.drawing.OverlayType.POLYGON,
            polygonOptions: {
            fillColor: 'red',
            strokeColor: 'red',
            editable: true,
            draggable: false
            }
        });
    });
}

function updateSystemListener() {
    // listener for update button click
    document.getElementById('update').onmouseup = function(){
        var selected_polygon = getSelectedPolygon();

        // there is no currently selected polygon
        if (selected_polygon == null)
            return;

        // check values are not null
        if (document.getElementById('azimuth').value != "")
            selected_polygon.azimuthValue = Number(document.getElementById('azimuth').value);
        if (document.getElementById('tilt').value != "")
            selected_polygon.tiltValue = document.getElementById('tilt').value;
        if (document.getElementById('rowSpace').value != "")
            selected_polygon.rowSpaceValue = document.getElementById('rowSpace').value;
        if (document.getElementById('orientation').value != "")
            selected_polygon.orientationValue = document.getElementById('orientation').value;
        if (document.getElementById('panel_specs').value != "") {
            var panelId = document.getElementById('panel_specs').value;
            selected_polygon.panelType = document.getElementById('panel_specs')[panelId].text;
            selected_polygon.moduleWattage = document.getElementById('panel_specs')[panelId].getAttribute('data-wattage');
            selected_polygon.panelLength = document.getElementById('panel_specs')[panelId].getAttribute('data-length');
            selected_polygon.panelWidth = document.getElementById('panel_specs')[panelId].getAttribute('data-width');
        }
        
        // remove previous panel layout
        selected_polygon.panelArray.setMap(null); 
    
        // generate a new panel layout
        panelLayout(selected_polygon);
    
        // obtain updated energy production data based on new panellayout
        getEnergyProduction(selected_polygon, function(data) {
            // update energy production reading
            selected_polygon.energyProduction = data;
            // update table with system info
            var project_stats = document.getElementById("projectStats");
            project_stats.innerHTML = "Nameplate Capacity: " + selected_polygon.systemCapacity + "kW<br>";
            project_stats.innerHTML += "# of panels: " + selected_polygon.numPanels + "<br>";
            project_stats.innerHTML += "Energy Production: " + Math.round(selected_polygon.energyProduction[2], 0) + "kWh (monthly)<br>";
            project_stats.innerHTML += "Panel Type: " + selected_polygon.panelType;
        });   
    };
}

function selectPolygon(polygon_object) {
    unselectAllPolygons();
    polygon_object.click_status = 1;
    polygon_object.polygon.setOptions({fillColor: 'green',
                                       strokeColor: 'green'});

    setZoomOnPolygon(polygon_object);
    var project_stats = document.getElementById("projectStats");
    project_stats.innerHTML = "Nameplate Capacity: " + polygon_object.systemCapacity + "kW<br>";
    project_stats.innerHTML += "# of panels: " + polygon_object.numPanels + "<br>";
    project_stats.innerHTML += "Energy Production: " + Math.round(polygon_object.energyProduction[2], 0) + "kWh (monthly)<br>";
    project_stats.innerHTML += "Panel Type: " + polygon_object.panelType;
}

function deleteProjectStats() {
    var project_stats = document.getElementById("projectStats");
    project_stats.innerHTML = "Nameplate Capacity: " + "0" + "kW<br>";
    project_stats.innerHTML += "# of panels: " + "0" + "<br>";
    project_stats.innerHTML += "Energy Production: " + "0" + "kWh (monthly)<br>";
    project_stats.innerHTML += "Panel Type: " + "NA";
}

function getSelectedPolygon() {
    var polygons = MYLIBRARY.getPolygons();
    for (i=0;i<polygons.length;i++) {
        if (polygons[i].click_status == 1)
            return polygons[i];
    }
    return null;
}

function unselectAllPolygons() {
    var polygons = MYLIBRARY.getPolygons();
    for (i=0;i<polygons.length;i++) {
        if (polygons[i].click_status == 1) {
            polygons[i].click_status = 0;
            polygons[i].polygon.setOptions({fillColor: 'yellow',
                                            strokeColor: 'yellow'});
        }
    }
}    

function printCoordinates(coordinates) {
    for (var i=0; i < coordinates.length; i++) {
        var xy = coordinates[i];
        // requires lat()/lng() as lat/lng here are functions not keys in a dictionary
        console.log("lat: " + xy.lat() + "; lng: " + xy.lng());
    }
}

// determines max distance from all points so we can decide maximum number of panels that can be placed in one direction
function maxDistance(roof_area) {
    var distance = [];
    for (var i = 0; i < roof_area.length; i++) {
        for (j = i + 1; j < roof_area.length; j++) {
            distance.push(Math.sqrt((Math.pow((roof_area[i].lng - roof_area[j].lng),2) + Math.pow((roof_area[i].lng - roof_area[j].lng),2))));
        }
    }
    return Math.max(...distance);
}

function maxDistanceXY(roof_area) {
    var distance = [];
    for (var i = 0; i < roof_area.length; i++) {
        for (j = i + 1; j < roof_area.length; j++) {
            distance.push(Math.sqrt((Math.pow((roof_area[i].x - roof_area[j].x),2) + Math.pow((roof_area[i].y - roof_area[j].y),2))));
        }
    }
    return Math.max(...distance);
}

function endCoords(roof_area) {
    var latRoof = [];
    var lngRoof = [];
    for (var i = 0; i < roof_area.length; i++) {
        // requires lat() as lat/lng here are functions 
        //not keys in a dictionary
        latRoof.push(roof_area[i].lat()); 
        lngRoof.push(roof_area[i].lng());
    }
    return [{
             lat: Math.max(...latRoof),
             lng: Math.max(...lngRoof)
    },      {
             lat: Math.min(...latRoof),
             lng: Math.min(...lngRoof)
    }]; // array of [max, min] coordinates
}

// check if a collection of points falls within a polygon
function containsPolygon(points_array, polygon) {
    for (var i = 0; i < points_array.length; i++) {
        var point = new google.maps.LatLng(points_array[i].lat, points_array[i].lng);
        var roof_check = google.maps.geometry.poly.containsLocation(point, polygon);
        if (roof_check === false) {
            return false;
        }
    }
    return true;
}

// check if any collection of points are located in any keepouts
function containedInKeepout(points_array, keepouts) {
    for (var j=0;j<keepouts.length; j++) {
        var keepout = keepouts[j];
        // check if any of the four panel points lie within the current keepout
        for (var i=0; i<points_array.length; i++) {
            var point = new google.maps.LatLng(points_array[i].lat, points_array[i].lng);
            var roof_check = google.maps.geometry.poly.containsLocation(point, keepout);
            if (roof_check === true) {
                return true;
            }
        }
    }
    return false;
}

function latLngToPoint(latLng) {
    var TILE_SIZE = 256;
    var siny = Math.sin(latLng.lat * Math.PI / 180);

    // Truncating to 0.9999 effectively limits latitude to 89.189. This is
    // about a third of a tile past the edge of the world tile.
    siny = Math.min(Math.max(siny, -0.9999), 0.9999);

    return new google.maps.Point(
      TILE_SIZE * (0.5 + latLng.lng / 360),
      TILE_SIZE * (0.5 - Math.log((1 + siny) / (1 - siny)) / (4 * Math.PI)));
}

function pointToLatLng(xy){
    var TILE_SIZE = 256;
    var newLng = 360 * (xy.x/TILE_SIZE - 0.5);

    var yConst = Math.pow(Math.E, -4*Math.PI*(xy.y/TILE_SIZE - 0.5));

    var newLat = (180/Math.PI) * Math.asin((yConst - 1)/(1 + yConst));

    var newCoord = {lat: newLat, lng: newLng};

    return newCoord;
}

function mToCoordinates(solarWidth, latlngCenter){
    var zoom = map.getZoom();
    var scale = 1<<zoom;
    var metersPerPixel = 156543.03392 * Math.cos(latlngCenter.lat() * Math.PI / 180) / Math.pow(2, zoom);
    var mToPixel = solarWidth*(1/metersPerPixel);
    var pixelToWorld = mToPixel/scale;

    return pixelToWorld;
}

function panelLayout(p) {
    var polygon = p.polygon;
    var coordinates = p.coordinates;
    var azimuth = p.azimuthValue;
    var orientation = p.orientationValue;
    var rowSpace = p.rowSpaceValue;
    var tilt = p.tiltValue;
    var moduleWattage = p.moduleWattage;
    var panelLength = p.panelLength;
    var panelWidth = p.panelWidth;
    var latlngCenter = getPolygonCenter(coordinates);

    console.log('Azimuth1: ' + azimuth)
    
    //tilt multiplier to adjust how the panel would look tilted
    var tilt_coeff = Math.cos(tilt*Math.PI/180);
    //solar spec before tilt is considered

    var m_solar_spec = {width: panelWidth, length: panelLength};

    var pre_solar_spec = {width: mToCoordinates(m_solar_spec.width, latlngCenter), 
                          length: mToCoordinates(m_solar_spec.length, latlngCenter)};

    var lat;
    var port;
    if(orientation == 'portrait'){
        azimuth += 180; //not 0 bc it takes into account for the off-set so there are no negative values
        port = 1;
        lat = 0;
    } else if(orientation == 'landscape'){
        azimuth +=90
        port = 0;
        lat = 1;
    }

    var tilt_coeff = Math.cos(tilt*Math.PI/180);

    var solar_spec = {width: Math.pow(tilt_coeff, port) * pre_solar_spec.width, length:  Math.pow(tilt_coeff, lat) * pre_solar_spec.length};

    var row_space = Math.pow(rowSpace, lat); // space between row of panels
    var col_space = Math.pow(rowSpace, port); // space between column of panels

    var radius = Math.sqrt(Math.pow(solar_spec.length / 2, 2) + Math.pow(solar_spec.width / 2, 2));
    
    // angle between center and a corner point of panel
    var angleSpread = Math.atan(solar_spec.width/(solar_spec.length))*2;
    
    //determines equivalent azimuth for angles over 180 as the layout algorithm only works in one direction    

    //Converts azimuth angle into opposing angle that's under 180 deg. and converts maximum geometry angle 
    if(azimuth >= 361 && azimuth <= 540){
        azimuth -= 360;
    }

    console.log('Azimuth before offset: ' + azimuth);

    //the panel dimension changes effects the azimuth and this variable is the offsetter for both maxGeo and azimuth
    var azimuthOffSet = (111.44889707494237 - angleSpread*180/Math.PI)/2;

    azimuth -= azimuthOffSet;

    console.log('Azimuth after offset: ' + azimuth);

    var real_azimuthAngle = azimuth/180*Math.PI + 55.1/180*Math.PI; //63 degrees is when the two squars line up

    var thetaOffSet = -(8 + azimuthOffSet) * (Math.PI/180);

    var azimuthAngle;
    if(azimuth >= 0 && azimuth <= 90 || azimuth >= 181 && azimuth <= 270) {
        azimuthAngle = -(real_azimuthAngle + Math.PI/2);
        var theta = (90 - azimuthAngle - thetaOffSet);

    } else if(azimuth >= 91 && azimuth <= 180 || azimuth >= 271 && azimuth <= 360){
        azimuthAngle = -(real_azimuthAngle + Math.PI/2);
        var theta = (90 - azimuthAngle - 90 * Math.PI/180 - thetaOffSet);
    }
    //Calculates maximum distance of rectangle outside that fits right ouside the polygon
    var maxArea = endCoords(coordinates);
    var dlat = Math.abs(maxArea[1].lat - maxArea[0].lat);
    var dlng = Math.abs(maxArea[1].lng - maxArea[0].lng);
    // initialize array for panel indexes
    var solarSystem = []; 
    var solarSystemXY = []; 
    //Angles to determine where central points of each panel will be in relation to the previous one
    var angle1 = (azimuthAngle + angleSpread + Math.PI);
    var angle2 = (azimuthAngle + Math.PI);
    //Geometric profile of the biggest possible recentangular area around the user selected polygon
    var maxGeo = [
        {lat: maxArea[1].lat + dlat*Math.cos(theta)*Math.cos(theta), lng: maxArea[1].lng + dlat*Math.sin(theta)*Math.cos(theta)},
        {lat: maxArea[1].lat + dlat - dlng*Math.sin(theta)*Math.cos(theta), lng: maxArea[1].lng + dlng*Math.cos(theta)*Math.cos(theta)},
        {lat: maxArea[1].lat + dlat - dlat*Math.cos(theta)*Math.cos(theta), lng: maxArea[1].lng + dlng - dlat*Math.sin(theta)*Math.cos(theta)},
        {lat: maxArea[1].lat + dlng*Math.sin(theta)*Math.cos(theta), lng: maxArea[1].lng + dlng - dlng*Math.cos(theta)*Math.cos(theta)},
    ];

    var maxGeoXY = [];

    for(i=0; i<maxGeo.length; i++){
        maxGeoXY.push(latLngToPoint(maxGeo[i]));
    }

    //Determines the starting point of the panel layout depending on the azimuth
    if(azimuth >= 0 && azimuth <= 90){
        var initCorner = 0;
    } else if(azimuth >= 91 && azimuth <= 180) {
        var initCorner = 1;
    } else if(azimuth >= 181 && azimuth <= 270) {
        var initCorner = 2;
    } else if(azimuth >= 271 && azimuth <= 360) {
        var initCorner = 3;
    }
    // determines max number of rows/columns in a solar system
    var maxD2 = maxDistance(maxGeo);
    var maxD2XY = maxDistanceXY(maxGeoXY);
    var smallerDimPanel = Math.min(solar_spec.width, solar_spec.length);

    var num_col = Math.round(maxD2 / smallerDimPanel);
    var num_row = num_col;

    var num_colXY = Math.round(maxD2XY / smallerDimPanel);
    var num_rowXY = num_colXY;

    // lays out panel over the polygon and determines if it's in the polygon or not

    for (j = 0; j < num_colXY; j++) {
        for (i = 0; i < num_rowXY; i++) {
            var panelCoordsXY = [];
            var centerPanelCoordXY = {

                x: maxGeoXY[initCorner].x + radius * Math.sin(angle2) * ((row_space*i - col_space*j)) + radius * Math.sin(angle1) * ((row_space*i + col_space*j)),
                y: maxGeoXY[initCorner].y + radius * Math.cos(angle2) * (row_space*i - col_space*j) + radius * Math.cos(angle1) * (row_space*i + col_space*j)
                
            };

             // start populating rooftop from min lat, max lng ==> bottom right of panel
            var pv_corner_arrayXY = [
            {   // min lat, max lng ==> bottom right of panel
                x: centerPanelCoordXY.x + radius * Math.sin(azimuthAngle),
                y: centerPanelCoordXY.y + radius * Math.cos(azimuthAngle)
                
            },
            {   // min lat, min lng ==> bottom left of panel
                x: centerPanelCoordXY.x + radius * Math.sin(azimuthAngle + angleSpread),
                y: centerPanelCoordXY.y + radius * Math.cos(azimuthAngle + angleSpread)
                
            },
            {   // max lat, min lng top left of panel
                x: centerPanelCoordXY.x + radius * Math.sin(azimuthAngle + Math.PI),
                y: centerPanelCoordXY.y + radius * Math.cos(azimuthAngle + Math.PI)
                
            },
            {   // max lat, max lng ==> top right of panel
                x: centerPanelCoordXY.x + radius * Math.sin(azimuthAngle + angleSpread + Math.PI),
                y: centerPanelCoordXY.y + radius * Math.cos(azimuthAngle + angleSpread + Math.PI)
                
            }
            ];

            //converts point coordinate to lat/lng
            for(n=0; n<pv_corner_arrayXY.length; n++){
                pv_corner_arrayXY[n] = pointToLatLng(pv_corner_arrayXY[n]);
            }

            //check if any corners are not within our rooftop polygon
            if (containsPolygon(pv_corner_arrayXY, polygon) === false) {
                continue;
            }

            // check if any corners are within our collection of keepout regions
            if (containedInKeepout(pv_corner_arrayXY, p.keepouts))
                continue;

            //add panel to panel array
            for (m = 0; m < pv_corner_arrayXY.length; m++) {
                panelCoordsXY.push(pv_corner_arrayXY[m]);
            }
            
            // add panel to solar system array
            solarSystemXY.push(panelCoordsXY);
        }
    }

    // set the new panel array
    p.panelArray = new google.maps.Polygon({ 
        map: map,
        paths: solarSystemXY,
        strokeColor: 'grey',
        strokeOpacity: 1,
        strokeWeight: 1,
        fillColor: '#084c8d',
        fillOpacity: 1,
        zIndex: google.maps.Marker.MAX_ZINDEX
    });

    // update polygon panel array parameters here
    p.systemCapacity = moduleWattage * solarSystemXY.length/1000;
    p.numPanels = solarSystemXY.length;
    p.latlngCenter = latlngCenter;
}

function addKeepout(keepout_polygon) {
    var selected_polygon = getSelectedPolygon();
    if (selected_polygon == null)
        return;

    var main_polygon = selected_polygon.polygon;

    // add keepout polygon to main polygon object
    selected_polygon.keepouts.push(keepout_polygon);

    // create listener to update keepout if boundaries change
    google.maps.event.addListener(keepout_polygon.getPath(), "set_at", function() {
        selectPolygon(selected_polygon);
        selected_polygon.updatePolygon();
    })
    // listen for edit event on adding new vertices
    google.maps.event.addListener(keepout_polygon.getPath(), "insert_at", function() {
        selectPolygon(selected_polygon);
        selected_polygon.updatePolygon();
    })
    // listen for undo edit event on polygon
    google.maps.event.addListener(keepout_polygon.getPath(), "remove_at", function() {
        selectPolygon(selected_polygon);
        selected_polygon.updatePolygon();
    })
 
    // get MVCArray of MVCArrays which are each one panel
    var panels = selected_polygon.panelArray.getPaths();
    for (var i=0; i<panels.getLength(); i++) {
        var panel = panels.getAt(i);
        for (var j=0; j<panel.getLength(); j++) {
            var xy = panel.getAt(j);
            if (google.maps.geometry.poly.containsLocation(xy, keepout_polygon)) {
                panels.removeAt(i);
                i--; // having removed a panel, we must remain at the same index
                break;
            }
        }
    }
    // set the new panel layout
    selected_polygon.updatePolygon();
}

function setZoomOnPolygon(polygon_object) {
    var bound = new google.maps.LatLngBounds(null);
    for(var i=0; i<polygon_object.coordinates.length; i++) 
        bound.extend( new google.maps.LatLng(polygon_object.coordinates[i].lat(), 
            polygon_object.coordinates[i].lng()));

    map.setZoom(21);
    map.fitBounds(bound);
}

function getPolygonCenter(coordinates) {
    var bound = new google.maps.LatLngBounds();
    for(var i=0;i<coordinates.length; i++) {
        bound.extend(coordinates[i]);
    }
    return bound.getCenter();
}

function createPolygonListButton() {
    var p_list = document.getElementById('polygon_list');
    var entry = document.createElement('div');
    entry.className = "list-group-item";
    var entry_btn = document.createElement('button');
    entry_btn.className = "btn btn-xs btn-info";
    entry_btn.innerHTML = "Rooftop #" + MYLIBRARY.getPolygons().length;
    var delete_span = document.createElement('span');
    delete_span.className = "pull-right";
    var delete_btn = document.createElement('button');
    delete_btn.className = "btn btn-xs btn-warning";
    delete_btn.innerHTML = "&times";
    delete_span.appendChild(delete_btn);
    entry.appendChild(entry_btn);
    entry.appendChild(delete_span);
    p_list.appendChild(entry);

    return { entry_btn  : entry_btn, 
            delete_btn  : delete_btn 
           };
}

function Polygon(polygon) // polygon object
{
    this.click_status = 0;

    this.polygon = polygon;
    this.coordinates = polygon.getPath().getArray();
    this.keepouts = [];
    this.panelArray = null;
    this.panelArrayListener = null;
    this.listeners = [];
    this.azimuthValue = 120;
    this.orientationValue = 'portrait';
    this.rowSpaceValue = 1.6;
    this.tiltValue = 30;
    this.moduleWattage = 235;
    this.panelLength = 1.2;
    this.panelWidth = 1.6;
    this.systemCapacity = "loading...";
    this.latlngCenter = getPolygonCenter(this.coordinates); // updated in panelLayout()
    this.energyProduction = "loading...";
    this.numPanels = "loading...";
    this.panelType = null;

    this.updatePolygon = function () {
        this.coordinates = this.polygon.getPath().getArray();
        this.panelArray.setMap(null); 
        
        // must remove old listener on previous panelArray
        google.maps.event.removeListener(this.panelArrayListener);

        // obtain data from new panel layout
        panelLayout(this);

        var p = this; // need to pass the scope into the callback function for getEnergyProduction()
        getEnergyProduction(p, function(data) {
            p.energyProduction = data;
            selectPolygon(p); // must call this function again to update panel settings display
        });

        // must add a new listener on the updated panel array
        this.panelArrayListener = google.maps.event.addListener(this.panelArray, 'click', function () { 
            selectPolygon(p); 
        });
    }
}

//***GLOBAL VARIABLES******
var map;

function initialize() {
    var markers = [];
    map = new google.maps.Map(
    document.getElementById(MYLIBRARY.getMapId()), {
        center: new google.maps.LatLng(37.7918, -122.4266),
        zoom: 21,
        tilt: 0,
        mapTypeId: google.maps.MapTypeId.SATELLITE
    });

    // Try HTML5 geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function (position) {
            var pos = {
                lat : position.coords.latitude,
                lng : position.coords.longitude
            };
            // set map centered on current location
            map.setCenter(pos);
        });
    }

    // position search bar and enable autocomplete
    var search_input = document.getElementById('user_search');
    var autocomplete = new google.maps.places.Autocomplete(search_input);
    autocomplete.bindTo('bounds', map);

    // Get the full place details when the user selects a place from the
    // list of suggestions.
    google.maps.event.addListener(autocomplete, 'place_changed', function() {
        var place = autocomplete.getPlace();
        if (!place.geometry) {
            return;
        }
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(21);
        }
    })
    // position center control manager
    var centerControlDiv = document.createElement('div');
    var centerControl = new CenterControl(centerControlDiv, map);
    centerControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.LEFT_TOP].push(centerControlDiv);

    // position polygon tracking list
    var polygonListDiv = document.createElement('div');
    polygonListDiv.className = "list-group";
    polygonListDiv.id = "polygon_list";
    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(polygonListDiv);

    // drawing manager
    var draw = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            google.maps.drawing.OverlayType.POLYGON
          ]
        },
        polygonOptions: {
            fillColor: 'yellow',
            strokeColor: 'yellow',
            editable: true,
            draggable: false
        }
    });
    
    draw.setMap(map);

    google.maps.event.addListener(map, 'idle', function() {
        // create listener for draw button
        drawButtonListener(draw);
    });

    // event listener to obtain lat/lng coordinates from drawn polygon **************
    google.maps.event.addListener(draw, 'polygoncomplete', function (polygon) {
        // switch back to the hand option
        draw.setOptions({
            drawingMode: null
        });

        // remove polygon if it is keepout and not in keepout mode
        // or there is currently no selected polygon that exists
        var DRAW_MODE = 0;
        if (MYLIBRARY.getDrawingMode() === DRAW_MODE) {
            if (polygon.get('fillColor') != 'yellow') {
                polygon.setMap(null);
                return;
            }
        }

        //******DETERMINE IF KEEPOUT*******
        var KEEPOUT_MODE = 1;
        if (MYLIBRARY.getDrawingMode() === KEEPOUT_MODE) {
            // no polygon to map to or invalid fill color
            if (getSelectedPolygon() == null || polygon.get('fillColor') !== 'red') {
                polygon.setMap(null);
                return;
            }

            // may finally add keepout polygon
            addKeepout(polygon);
            return;
        }

        // create polygon object
        var p = new Polygon(polygon);

        // add to global list of polygons
        MYLIBRARY.addToPolygons(p);

        // add a new polygon btn (and delete btn) to polygon_list
        var list_button_group = createPolygonListButton();
        var entry_btn = list_button_group.entry_btn;
        var delete_btn = list_button_group.delete_btn;

        // add a listener for polygon_list button
        entry_btn.onmouseup = function () {
            selectPolygon(p);
        };

        // add a listener to delete polygon and polygon button
        delete_btn.onmouseup = function () {
            console.log(document.getElementById("projectStats"));
            deleteProjectStats();
            p.panelArray.setMap(null);
            p.polygon.setMap(null);
            for (var i=0; i<p.keepouts.length;i++)
                p.keepouts[i].setMap(null);
            entry_btn.parentNode.parentNode.removeChild(entry_btn.parentNode);
            MYLIBRARY.removePolygon(p);
            
            delete p;
        } 

        // get array of vertices in lat/lng format of polygon
        var output = null;

        // select this polygon and unselect all others
        selectPolygon(p);

        // ***generate default panel layout independent of other listeners
        // requires lat() as lat/lng here are functions not keys in a dictionary
        panelLayout(p);

        // get type of panel and store it
        var panel_specs = document.getElementById('panel_specs');
        var panelId = panel_specs.value;
        p.panelType = panel_specs[panelId].text;

        // get energy production data and update panel display
        getEnergyProduction(p, function(data) {
            p.energyProduction = data;

            // update table with system info
            var project_stats = document.getElementById("projectStats");
            project_stats.innerHTML = "Nameplate Capacity: " + p.systemCapacity + "kW<br>";
            project_stats.innerHTML += "# of panels: " + p.numPanels + "<br>";
            project_stats.innerHTML += "Energy Production: " + Math.round(p.energyProduction[2],0) + "kWh (monthly)<br>";
            project_stats.innerHTML += "Panel Type: " + p.panelType;

            // listener for click on polygon
            google.maps.event.addListener(p.polygon, 'click', function () {
                // select this polygon and unselect all others
                selectPolygon(p);
            });
            p.panelArrayListener = google.maps.event.addListener(p.panelArray, 'click', function () {
                selectPolygon(p);
            });
        });

        // listen for edit event on moving existing vertices
        google.maps.event.addListener(p.polygon.getPath(), "set_at", function() {
            selectPolygon(p);
            p.updatePolygon();
        })
        // listen for edit event on adding new vertices
        google.maps.event.addListener(p.polygon.getPath(), "insert_at", function() {
            selectPolygon(p);
            p.updatePolygon();
        })
        // listen for undo edit event on polygon
        google.maps.event.addListener(p.polygon.getPath(), "remove_at", function() {
            selectPolygon(p);
            p.updatePolygon();
        })

        // listen for mouseover polygon event
        google.maps.event.addListener(p.polygon, "mouseover", function() {
            p.polygon.setOptions({fillColor: "orange",
                                  strokeColor: "orange"});
        })

        // listen for mouse out polygon event
        google.maps.event.addListener(p.polygon, "mouseout", function(event) {
            if(p.click_status == 0) // unselected
                p.polygon.setOptions({fillColor: "yellow",
                                  strokeColor: "yellow"});
            else // selected
                p.polygon.setOptions({fillColor: "green",
                                  strokeColor: "green"});
        })

        // update array upon parameter changes in control box
        updateSystemListener();

        // create listener for keepouts
        keepoutButtonListener(draw);

        // listener for sending an email report
        sendEmailReportListener();
    });  
}