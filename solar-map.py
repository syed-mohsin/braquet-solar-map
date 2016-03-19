from flask import Flask, render_template, request, Response, json, jsonify
from pymongo import MongoClient
from googleplaces import GooglePlaces, types, lang
from geopy.geocoders import Nominatim
from gmap import Map
import credentials
import numpy as np
from decimal import Decimal
import json
import urllib2
import os

app = Flask(__name__)
mongo = credentials.connect()
google_places = GooglePlaces(credentials.API_KEY)
geolocator = Nominatim()

@app.route("/", methods=["GET", "POST"])
def mapview():

	# create a map in view
	mymap = Map(
		identifier="view-side",
		lat=37.4419,
		lng=-122.1419,
		markers=[(37.4419,-122.1419)],
		style="height:600px;width:1000px;margin:0;"
	)
	locations = None

	# place markers on map corresponding to retrieved business results
	if request.method == "POST":
		query = google_places.nearby_search(location=request.form["user_search"], radius=100)
		markers = [(place.geo_location['lat'], place.geo_location['lng']) for place in query.places]

		roof_borders = []

		mymap = Map(
			identifier="view-side",
			maptype='SATELLITE',
			lat=query.places[0].geo_location['lat'],
			lng=query.places[0].geo_location['lng'],
			infobox=["<img src='./static/chicken.jpg' height=100 width=100>"]*len(query.places),
			markers=markers,
			roof_borders=roof_borders,
			style="height:600px;width:1000px;margin:0;",
			zoom=20
		)

	return render_template('home.html', mymap=mymap, locations=locations)

@app.route("/nrel", methods =["POST"])
def nrel():
	if request.method == "POST":
		lat = str(request.json['lat'])
		lng = str(request.json['lng'])
		tilt = str(request.json['tilt'])
		azimuth = str(request.json['azimuth'])
		capacity = str(request.json['capacity'])
		print lat, lng, tilt, azimuth, capacity

		try:
			response = urllib2.urlopen("https://developer.nrel.gov/api/pvwatts/v5.json?api_key=" + credentials.NREL_API_KEY + \
				"&lat=" + lat + "&lon=" + lng + "&system_capacity=" + capacity + "&azimuth=" + azimuth + "&tilt=" + tilt + "&array_type=1&module_type=0&losses=10")
		except IOError, e:
			return "ERROR: API call failed"

		data = json.load(response)
		print data["outputs"]["dc_monthly"][0] # january output
		if data["outputs"]["dc_monthly"] != None:
			return str(data["outputs"]["dc_monthly"][0])
		else:
			return "error retrieving energy production"

	else:
		return str("404 ERROR");




if __name__ == "__main__":
	app.run(debug=True)





