from flask import render_template, Blueprint, Markup

## code modified from open source flask module 'Flask-GoogleMaps'
DEFAULT_ICON = '//maps.google.com/mapfiles/ms/icons/red-dot.png'

def panel_specs():
    data = {'panels':[
    {'id':0, 'model_name': 'Canadian Solar 270/60 (CS6K)', 'wattage': 270, 'length': 0.992, 'width': 1.65}, 
    {'id':1, 'model_name': 'Canadian Solar 320/72 (CS6X)', 'wattage': 320, 'length': 0.996, 'width': 1.972},
    {'id':2, 'model_name': 'Ying Li 250/60 (YL250P-29b)', 'wattage': 250, 'length': 0.990, 'width': 1.640},
    {'id':3, 'model_name': 'Ying Li 300/72 (YL300P-35b)', 'wattage': 300, 'length': 0.990, 'width': 1.960},
    {'id':4, 'model_name': 'Lightway 315/72 (LW6P72b)', 'wattage': 315, 'length': 0.990, 'width': 1.960},
    ]}
    return data

class Map(object):
	def __init__(self, identifier, lat, lng,
				 zoom=19, maptype="SATELLITE", markers=None,
				 varname='map',
				 style="height:600px;width:1000px;margin:0;",
				 roof_borders=None,
				 cls="map", 
				 **kwargs):
		self.cls= cls
		self.style = style
		self.varname = varname
		self.center = (lat, lng)
		self.zoom = zoom
		self.maptype = maptype
		self.markers = markers or []
		self.roof_borders = roof_borders or []
		if isinstance(markers, list):
				self.markers = {DEFAULT_ICON: markers}
		self.identifier = identifier
		if 'infobox' in kwargs:
			self.infobox = kwargs['infobox']
			# jinja2 has no builtin for type so a flag is set to check if infobox is
            # string or list for the template iteration
			if type(kwargs['infobox']) is list:
				self.typeflag = True
		else:
			self.infobox = None

		self.panel_data = panel_specs()

	def add_marker(self, lat, lng):
		self.markers.append((lat, lng))

	def render(self, *args, **kwargs):
		return render_template(*args, **kwargs)

	@property
	def js(self):
		panel_data = panel_specs()
		return Markup(self.render('homejs.html', gmap=self, panel_data = panel_data))


