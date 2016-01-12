from flask import Flask, render_template, request
from pymongo import MongoClient
from googleplaces import GooglePlaces, types, lang
from geopy.geocoders import Nominatim
from gmap import Map
import credentials
import numpy as np
from decimal import Decimal
import json
import urllib
import cv2
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

		# data = []
		# for place in query.places:
		# 	if mongo.rooftop_data.find_one({"name": place.name}) == None:
		# 		place.get_details()
		# 		data.append({"name": place.name,
		# 				     "geocode": (str(place.geo_location['lat']), str(place.geo_location['lng'])),
		# 					 "rooftopCoords": None,
		# 					 "address": place.formatted_address,
		# 					 "isProcessed": False
		# 		})

		# # insert new locations into database
		# mongo.rooftop_data.insert_many(data)

		# draw rooftop area on map ********************************************************************
		roof_borders = []
		for place in query.places:
			roof = mongo.rooftop_data.find_one({"name": place.name, "isProcessed": True})
			if roof:
				border = [{'lat': float(x[0]), 'lng': float(x[1])} for x in roof["rooftopCoords"]]
				roof_borders.append(border)
		# *********************************************************************************************

		mymap = Map(
			identifier="view-side",
			maptype='SATELLITE',
			lat=query.places[0].geo_location['lat'],
			lng=query.places[0].geo_location['lng'],
			infobox=["<img src='./static/chicken.jpg' height=100 width=100>"]*len(query.places),
			markers=markers,
			roof_borders=roof_borders,
			style="height:600px;width:1000px;margin:0;",
			zoom=15
		)

		# obtain business location details
		# locations = []
		# for place in query.places:
		# 	place.get_details()
		# 	locations.append([place.name, place.formatted_address])

		# download google static maps for image processing
		# downloadStaticGoogleMaps(markers)


	return render_template('home.html', mymap=mymap, locations=locations)

def downloadStaticGoogleMaps(markers):
	# for marker in markers:
	url = "http://maps.googleapis.com/maps/api/staticmap?center=" + \
	      str(markers[0][0]) + ',' + str(markers[0][1]) + '&' + 'maptype=satellite&zoom=19' + \
	      "&size=400x400&sensor=false" 

	img_loc = "static/maps/" + str(markers[0][0]) + str(markers[0][1]) + ".jpg"

	urllib.urlretrieve(url, img_loc)

	# im = cv2.imread(img_loc)
	# imgray = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
	# ret, thresh = cv2.threshold(imgray, 127, 255, 0)
	# contours, hierarchy = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)

	# cv2.drawContours(im, contours, -1, (0,255,0), 3)


if __name__ == "__main__":
	app.run(debug=True)

# search bar where you can input an address/location

# pip install flask-googlemaps, pip install flask
# pip install --upgrade google-api-python-client
# pip install geopy
# pip install python-google-places
# pip install numpy
# pip install Flask-PyMongo

# MAC 
# $ flask/bin/pip install flask
# $ flask/bin/pip install flask-login
# $ flask/bin/pip install flask-openid
# $ flask/bin/pip install flask-mail
# $ flask/bin/pip install flask-sqlalchemy
# $ flask/bin/pip install sqlalchemy-migrate
# $ flask/bin/pip install flask-whooshalchemy
# $ flask/bin/pip install flask-wtf
# $ flask/bin/pip install flask-babel
# $ flask/bin/pip install guess_language
# $ flask/bin/pip install flipflop
# $ flask/bin/pip install coverage

# Windows
# $ flask\Scripts\pip install flask
# $ flask\Scripts\pip install flask-login
# $ flask\Scripts\pip install flask-openid
# $ flask\Scripts\pip install flask-mail
# $ flask\Scripts\pip install flask-sqlalchemy
# $ flask\Scripts\pip install sqlalchemy-migrate
# $ flask\Scripts\pip install flask-whooshalchemy
# $ flask\Scripts\pip install flask-wtf
# $ flask\Scripts\pip install flask-babel
# $ flask\Scripts\pip install guess_language
# $ flask\Scripts\pip install flipflop
# $ flask\Scripts\pip install coverage