from flask import Flask, flash, render_template, request, Response, json, jsonify, send_file, redirect, url_for
# from flask.ext.stormpath import StormpathManager, login_required, groups_required, user, login_user, StormpathError
# from flask.ext.login import _get_user
# from flask.ext.stormpath.forms import LoginForm, RegistrationForm
# from flask.ext.stormpath.models import User
from flask_mail import Mail
from flask_mail import Message
from pymongo import MongoClient
from googleplaces import GooglePlaces, types, lang
from geopy.geocoders import Nominatim
from gmap import Map
import numpy as np
from decimal import Decimal
import json
import urllib2
import base64
import os

def connect():
	client = MongoClient(os.environ['MONGO_URI'], int(os.environ['MONGO_PORT']))
	handle = client[os.environ['MONGO_COLLECTION']]
	handle.authenticate(os.environ['MONGO_USERNAME'], os.environ['MONGO_PASSWORD'])
	return handle

MAIL_SERVER = 'smtp.gmail.com'
MAIL_PORT   = 465
MAIL_USE_TLS = False
MAIL_USE_SSL = True
MAIL_USERNAME = os.environ['MAIL_USERNAME']
MAIL_PASSWORD = os.environ['MAIL_PASSWORD']

app = Flask(__name__)

# app configurations
app.config.from_object(__name__)
# app.config['SECRET_KEY'] = credentials.STORMPATH_SECRET_KEY
# app.config['STORMPATH_API_KEY_FILE'] = credentials.STORMPATH_API_KEY_FILE
# app.config['STORMPATH_APPLICATION'] = credentials.STORMPATH_APPLICATION
# app.config['STORMPATH_REGISTRATION_TEMPLATE'] = 'registration.html'
# app.config['STORMPATH_LOGIN_TEMPLATE'] = 'login.html'
# app.config['STORMPATH_REDIRECT_URL'] = '/dashboard'
# app.config['STORMPATH_REGISTRATION_REDIRECT_URL'] = '/dashboard'
# app.config['STORMPATH_ENABLE_LOGIN'] = False
# app.config['STORMPATH_ENABLE_REGISTRATION'] = False

# clients connected to app
mail = Mail(app)
# stormpath_manager = StormpathManager(app)
mongo = connect()
google_places = GooglePlaces(os.environ['API_KEY'])
geolocator = Nominatim()
NREL_API_KEY = os.environ['NREL_API_KEY']

@app.route("/index", methods=["GET"])
@app.route("/", methods=["GET"])
def freemapview():
	# if user and user.is_authenticated():
	# 	return redirect(url_for("dashboard"))

	rule = request.url_rule
	user_data = {'logged_in' : False}

	logo = "Braquet | Layout"

	# create a map in view
	mymap = Map(
		identifier="view-side",
		lat=37.7918,
		lng=-122.4266,
		markers=[],
		style="height:600px;width:1000px;margin:0;"
	)

	return render_template('home.html', mymap=mymap, logo=logo, user_data=user_data)

@app.route("/dashboard", methods=["GET"])
def dashboard():
	# print "REFERRER****************" + request.referrer
	# user_data = {}
	# if user and user.is_authenticated():
	# 	user_data['logged_in'] = True
	# 	user_data['name'] = user.given_name
	# 	user_data['email'] = user.email
	# else:

	return redirect(url_for('freemapview'))

	logo = "Braquet | Layout"

	# create a map in view
	mymap = Map(
		identifier="view-side",
		lat=37.7918,
		lng=-122.4266,
		markers=[],
		style="height:600px;width:1000px;margin:0;"
	)

	return render_template('home.html', mymap=mymap, logo=logo, is_demo=False,
						   user_data=user_data)

@app.route("/nrel", methods=["POST"])
def nrel():
	if request.method == "POST":
		lat = str(request.json['lat'])
		lng = str(request.json['lng'])
		tilt = str(request.json['tilt'])
		azimuth = str(request.json['azimuth'])
		capacity = str(request.json['capacity'])

		try:
			response = urllib2.urlopen("https://developer.nrel.gov/api/pvwatts/v5.json?api_key=" + NREL_API_KEY + \
				"&lat=" + lat + "&lon=" + lng + "&system_capacity=" + capacity + "&azimuth=" + azimuth + "&tilt=" + tilt + "&array_type=1&module_type=0&losses=10")
		except e:
			return "ERROR: API call failed"

		data = json.load(response)
		if data["outputs"]["dc_monthly"] != None:
			return jsonify(dict([(i, data["outputs"]["dc_monthly"][i]) for i in range(len(data))]))
		else:
			return "error retrieving energy production"

	else:
		return "404 ERROR";

@app.route("/sendEmailReport", methods=["POST"])
def sendEmailReport():
	if request.method == "POST":
		# base64 encoded image
		screenshot_base64 = str(request.json['screenshot'])[22:] # shave off the header "data:image/png;base64<comma_here>"
		chart_base64 = str(request.json['chart'])[22:]
		energy = request.json['energy']['2']
		numPanels = str(request.json['numPanels'])
		panelType = str(request.json['panelType'])

		# screenshot image location
		img_loc = "static/maps/rooftop_screenshot.png"
		chart_loc = "static/maps/production_chart.png"

		# decode base64 png screenshot
		fp1 = open(img_loc, "wb")
		fp2 = open(chart_loc, "wb")
		fp1.write(base64.b64decode(screenshot_base64))
		fp2.write(base64.b64decode(chart_base64))
		fp1.close()
		fp2.close()

		msg = Message("Braquet | Solar Report",
					  sender=("Braquet", MAIL_USERNAME),
					  recipients=["syedm.90@gmail.com"])

		msg.html = render_template('email.html', energy=energy, numPanels=numPanels, panelType=panelType)

		with app.open_resource(img_loc) as screenshot:
			msg.attach(img_loc, "image/png", screenshot.read())

		with app.open_resource(chart_loc) as chart:
			msg.attach(chart_loc, "image/png", chart.read())

		mail.send(msg)

		return "success"

	else:
		return "404 ERROR"

@app.route('/login', methods=['GET', 'POST'])
def login():
    """
    This view logs in a user given an email address and password.
    This works by querying Stormpath with the user's credentials, and either
    getting back the User object itself, or an exception (in which case well
    tell the user their credentials are invalid).
    If the user is valid, we'll log them in, and store their session for later.
    """
    # form = LoginForm()

    if request.method == 'GET':
        return render_template('login.html', form=form)

    # if request.method == 'POST':
	#     try:
	#         _user = User.from_login(
	#             request.form.get('login'),
	#             request.form.get('password')
	#         )
	#     except err:
	#     	flash(err.message.get('message'))
	#         return render_template('login.html', form=form)
	#
	#     login_user(_user, remember=True)
	#     return render_template('login.html', form=form, success=True)

@app.route('/register', methods=['GET', 'POST'])
def register():
	"""
	Register a new user with Stormpath.
	This view will render a registration template, and attempt to create a new
	user account with Stormpath.
	The fields that are asked for, the URL this view is bound to, and the
	template that is used to render this page can all be controlled via
	Flask-Stormpath settings.
	"""
	# form = RegistrationForm()

	if request.method == 'GET':
		return render_template(
			app.config['STORMPATH_REGISTRATION_TEMPLATE'],
			form = form
		)

	# if request.method == 'POST':
	# 	# If we received a POST request with valid information, we'll continue
	#     # processing.
	#     if form.validate_on_submit():
	#         fail = False
	#
	#         # Iterate through all fields, grabbing the necessary form data and
	#         # flashing error messages if required.
	#         data = form.data
	#         for field in data.keys():
	#             if app.config['STORMPATH_ENABLE_%s' % field.upper()]:
	#                 if app.config['STORMPATH_REQUIRE_%s' % field.upper()] and not data[field]:
	#                     fail = True
	#
	#                     # Manually override the terms for first / last name to make
	#                     # errors more user friendly.
	#                     if field == 'given_name':
	#                         field = 'first name'
	#
	#                     elif field == 'surname':
	#                         field = 'last name'
	#
	#                     flash('%s is required.' % field.replace('_', ' ').title())
	#
	#         # If there are no missing fields (per our settings), continue.
	#         if not fail:
	#
	#             # Attempt to create the user's account on Stormpath.
	#             try:
	#
	# 				# Since Stormpath requires both the given_name and surname
	# 				# fields be set, we'll just set the both to 'Anonymous' if
	# 				# the user has # explicitly said they don't want to collect
	# 				# those fields.
	# 				data['given_name'] = data['given_name'] or 'Anonymous'
	# 				data['surname'] = data['surname'] or 'Anonymous'
	#
	# 				# Create the user account on Stormpath.  If this fails, an
	# 				# exception will be raised.
	# 				account = User.create(**data)
	#
	# 				# If we're able to successfully create the user's account,
	# 				# we'll log the user in (creating a secure session using
	# 				# Flask-Login), then redirect the user to the
	# 				# STORMPATH_REDIRECT_URL setting.
	# 				login_user(account, remember=True)
	#
	# 				return render_template(
	# 					app.config['STORMPATH_REGISTRATION_TEMPLATE'],
	# 					form = form,
	# 					success = True
	# 				)
	#
	#             except err:
	#                 flash(err.message.get('message'))
	#
	# 	    return render_template(
	# 	        app.config['STORMPATH_REGISTRATION_TEMPLATE'],
	# 	        form = form,
	# 	    )

if __name__ == "__main__":
	app.run(debug=False)
