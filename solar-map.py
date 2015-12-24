from flask import Flask, render_template, request
from flask_googlemaps import GoogleMaps
from flask_googlemaps import Map
from googleplaces import GooglePlaces, types, lang

API_KEY = 'AIzaSyBRKjGUvrzzmZFJqSk_RrnZK4nWKUsaPTQ'
app = Flask(__name__)
GoogleMaps(app)
google_places = GooglePlaces(API_KEY)

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

	sndmap = Map(
		identifier="sndmap",
		lat=37.4419,
		lng=-122.1419,
		infobox=["<img src='./static/chicken.jpg' height=100 width=100>"],
		markers={'http://maps.google.com/mapfiles/ms/icons/green-dot.png':[(37.4419, -122.1419)],
                 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png':[(37.4300, -122.1400)]},
        style="height:600px;width:1000px;margin:0;"
        )

	locations = None

	# query_result = google_places.nearby_search(
	# 	location='Antioch, California', radius=100)

	if request.method == "POST":
		query = google_places.nearby_search(location=request.form["user_search"], radius=100)
		mymap = Map(
			identifier="view-side",
			lat=query.places[0].geo_location['lat'],
			lng=query.places[0].geo_location['lng'],
			infobox=["<img src='./static/chicken.jpg' height=100 width=100>"],
			markers=[(place.geo_location['lat'], place.geo_location['lng']) for place in query.places],
			style="height:600px;width:1000px;margin:0;",
			zoom=15
		)

		locations = [place.name for place in query.places]



	return render_template('home.html', mymap=mymap, sndmap=sndmap, locations=locations)

if __name__ == "__main__":
	app.run(debug=True)

# search bar where you can input an address/location

# API key
# AIzaSyBRKjGUvrzzmZFJqSk_RrnZK4nWKUsaPTQ

# pip install flask-googlemaps, pip install flask
# pip install --upgrade google-api-python-client
# pip install geopy
# pip install python-google-places

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