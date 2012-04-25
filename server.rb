#!/usr/bin/env ruby

require 'rubygems'
require 'sinatra'
require 'mongo'
require 'json'

DB = Mongo::Connection.new.db("fogapp") 

#get '/' do
#	File.new('public/index.html').readlines
#end

get  /^(?!\/(api))/ do
	content_type 'text/html'
	File.new('public/index.html').readlines
end

# get a list of all fogs
get '/api/fogs' do
	content_type :json
	resp = []
	DB.collection('meta').find().each do |row| 
		# map the id  to a string representation of the object's id 
		resp << from_bson_id(row)
	end
	# output to JSON
	puts resp.to_json
	resp = resp.to_json
end

# post (create) a new fog by inserting its metadata into the meta collection.
# each fog will also be its own collection, but the collection can be created ,
# lazily as needed. the document (post object) is passed in the request data
# (not the url). used for new posts and creating a new fog by submitting
# metadata. 
post %r{api/fog/new/?} do
	payload = request.body.read.to_s
	puts payload
	# XXX TODO check for duplicate name
	oid = DB.collection('meta').insert(JSON.parse(payload)) 
	# return the object (document) id as a string
	# either return the id as _id and use the idAttribute mapping in the model,
	# OR return it as "id" here. 
	"{\"_id\": \"#{oid.to_s}\"}" 
end

# add a new fog post 
post %r{/api/fog/(.*)/posts/?} do
	payload = request.body.read.to_s
	puts payload
	fogid = params[:captures].first
	oid = DB.collection(fogid).insert(JSON.parse(payload)) 
	# return the new post object id as a string
	oid_s = "{\"_id\": \"#{oid.to_s}\"}" 
	puts oid_s
	oid_s
end

# retrieve the posts of a specific fog
# make sure this is listed before the more general fog metadata call below or
# it will match on this call. 
get %r{/api/fog/(.*)/posts/?} do
	content_type :json
	fogid = params[:captures].first
	resp = []
	DB.collection(fogid).find().each do |row| 
		# map the id  to a string representation of the object's id 
		resp << from_bson_id(row)
	end
	# output to JSON
	resp = resp.to_json
end

delete %r{/api/fog/(.*)/posts/(.*)?} do
	fogid = params[:captures].first
	postid = params[:captures][1]
	puts "attempting to remove post #{postid} from #{fogid}"
	prev_count = DB.collection(fogid).count
	DB.collection(fogid).remove("_id" => to_bson_id(postid))
	new_count = DB.collection(fogid).count
	if new_count == (prev_count -1)
		puts "successfully removed fog #{fogid}" 
	else
		puts "error: count has not changed. #{postid} most likely still present."
	end
end

# to delete a fog, we have to delete the entry from the meta collection *and*
# drop the collection itself, if it exists. 
delete %r{api/fog/(.*)/?} do
	fogid = params[:captures].first
	puts "attempting to remove fog #{fogid}"
	prev_count = DB.collection('meta').count
	DB.collection('meta').remove("_id" => to_bson_id(fogid))
	new_count = DB.collection('meta').count
	if new_count == (prev_count -1)
		puts "successfully removed fog #{fogid}" 
	else
		puts "error: count has not changed. #{fogid} most likely still present."
	end
	DB.collection(fogid).drop
end

# get a specific fog post 
get %r{/api/fog/(.*)/post/(.*)/?} do
	fogid = params[:captures].first
	postid = params[:captures][1]
	oid = to_bson_id(postid)
	res = DB.collection(fogid).find("_id" => oid).to_a 
	resp = from_bson_id(res[0]).to_json
	puts resp
	return resp
end

# retrieve a single fog's metadata
get %r{/api/fog/(.*)/?} do
	content_type :json
	fogid = params[:captures].first
	puts "retrieving fog id #{fogid}"
	oid = to_bson_id(fogid)
	res = DB.collection('meta').find("_id" => oid).to_a
	resp = from_bson_id(res[0]).to_json
	puts resp
	return resp
end

# utilities for generating/converting MongoDB ObjectIds
def to_bson_id(id) BSON::ObjectId.from_string(id) end
def from_bson_id(obj) obj.merge({'_id' => obj['_id'].to_s}) end
