# About

GeoStream lets you share simple items with people who are nearby. It is a
backbone.js application built with a mongoDB backend and makes use of the HTML5
geolocation API. It was also mostly an excuse to learn backbone. GeoStream uses
Sinatra to serve restful URLs for the data API and Ruby to do backend care and
feeding. 

# Dependencies

- mongodb 
	- brew update; brew install mongodb
	- gem install mongodb
- sudo gem install json
- sudo gem install mongo
- sudo gem install bson_ext
- sudo gem install sinatra
- backbonejs and its dependencies (jquery, underscore, json2, etc.)
- npm install socket.io

# To start

- start mongo: run `mongod` command to start the mongodb database
- start the socket server `node app.js`
- start sinatra server: cd geostream; ./server.rb
- open public/index.html in your browser.

# Architecture

Streams are stored in mongo on the backend. The `public/` directory is the client
side, with the backbone code in public/js. `server.rb` provides the API to the
mongo database, responding to request to list, create, add posts, etc.
`carefeed.js` does background housekeeping to clean up expired streams. `app.js`
manages socket connections. 





