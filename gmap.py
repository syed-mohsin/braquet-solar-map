from flask import render_template, Blueprint, Markup

## code modified from open source flask module 'Flask-GoogleMaps'
DEFAULT_ICON = '//maps.google.com/mapfiles/ms/icons/red-dot.png'

class Map(object):
	def __init__(self, identifier, lat, lng,
				 zoom=1, maptype="SATELLITE", markers=None,
				 varname='map',
				 style="height:600px;width:1000px;margin:0;",
				 cls="map", 
				 **kwargs):
		self.cls= cls
		self.style = style
		self.varname = varname
		self.center = (lat, lng)
		self.zoom = zoom
		self.maptype = maptype
		self.markers = markers or []
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

	def add_marker(self, lat, lng):
		self.markers.append((lat, lng))

	def render(self, *args, **kwargs):
		return render_template(*args, **kwargs)

	@property
	def js(self):
		return Markup(self.render('homejs.html', gmap=self))


