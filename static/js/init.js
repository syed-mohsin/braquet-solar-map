var MYLIBRARY = MYLIBRARY || (function() {
	var _args = {}; // private

	return {
		init : function(Args) {
			_args = Args;
			// some other initializing if necessary
		},
		getMapId : function() {
			return _args["map_id"];
		},
		getMapName : function() {
			return _args["map_name"];
		},
		getPanelSpecs : function() {
			return _args["panel_data"];
		}
	};
}());