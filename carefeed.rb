# archive streams that have expired

# get expiry and metadata for each stream
DB = Mongo::Connection.new.db("fogapp") 

#
