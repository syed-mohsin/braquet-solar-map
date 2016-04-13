var MYLIBRARY = MYLIBRARY || (function() {
	var _args = {}; // private

	return {
		init : function(Args) {
			_args = Args;
			// some other initializing if necessary
		},
		getUser : function() {
			return _args["user"];
		},
		getMapId      : function() {
			return _args["map_id"];
		},
		getMapName    : function() {
			return _args["map_name"];
		},
		getPanelSpecs : function() {
			return _args["panel_data"];
		},
		getIsDemo     : function() {
			return _args["is_demo"];
		},
		getMap  	  : function() {
			return _args["map"];
		},
		getPolygons   : function() {
			return _args["polygons"];
		},
		getChartImg   : function() {
			return _args["chart_base64"];
		},
		setChartImg   : function(img) {
			_args["chart_base64"] = img;
		},
		addToPolygons : function(polygon) {
			if (_args["polygons"] == null)
				return -1;

			_args["polygons"].push(polygon);
			return 0;
		},
		removePolygon : function(polygon) {
			if (_args["polygons"].length > 0) {
				var index = _args["polygons"].indexOf(polygon);
				if (index > -1)
					_args["polygons"].splice(index, 1);
			}
		},
	};
}());