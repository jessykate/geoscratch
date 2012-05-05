# About

GeoStream lets you share simple items with people who are nearby. It is a
backbone.js application built with a mongoDB backend and makes use of the HTML5
geolocation API. It was also mostly an excuse to learn backbone. GeoStream uses
Sinatra to serve restful URLs for the data API and Ruby to do backend care and
feeding. 

# Dependencies

- mongodb (via it's own installer or gem install mongodb)
- gem install mongo
- gem install bson_ext
- sudo gem install sinatra
- backbonejs and its dependencies (jquery, underscore, json2, etc.)

# To start
- start mongo: run `mongod` command
- start sinatra server: cd geostream; ./server.rb




