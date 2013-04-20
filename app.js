// manage socket comms between clients and server
// to run: $ node app.js

var io = require('socket.io').listen(8421);

io.sockets.on('connection', function(socket) {
	socket.on('connect', function(socket) {
		// return list of streams
		// increment client count
	});

	socket.on('connect', function(data) {
		// get list of streams
	});

	socket.on('connectfog', function(data) {
		// get posts for this stream
		// increment client count for this stream
	});

	socket.on('newpost', function(data) {
		// create new stream post
		// notify all listening clients
	});

	socket.on('deletepost', function(data) {
		// delete stream post
		// notify all listening clients
	});

	socket.on('newstream', function(data) {
		// create new stream
		// notify all listening clients
	});

	socket.on('deletestream', function(data) {
		// delete stream
		// notify all listening clients
	});

	socket.on('disconnect', function(data) {
		// decrease client count for connected stream(s)
		// notify all relevant clients
	});

});

