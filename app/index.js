/*
primary file
*/

//Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');

//Instantiating the HTTP server
const httpServer = http.createServer((req,res) => {
	unifiedServer(req,res);

});

//Starting the HTTP server
httpServer.listen(config.httpPort, () => {
	console.log('The server is listening on port ' + config.httpPort);
});

// Instantiate the HTTPS server
const httpsServerOptions = {
	'key' : fs.readFileSync('./https/key.pem'),
	'cert' : fs.readFileSync('./https/cert.pem')
};
const httpsServer = https.createServer(httpsServerOptions, (req,res) => {
	unifiedServer(req,res);
});


// Start the HTTPS server
httpsServer.listen(config.httpsPort, () => {
	console.log('The server is listening on port ' + config.httpsPort);
});


// All the server logic for both the http and the https server
let unifiedServer  = (req, res) => {

	//Get the url and parse it
	let parsedUrl = url.parse(req.url, true)

	//Get the path
	let path = parsedUrl.pathname;
	let trimmedpath = path.replace(/^\/+|\/+$/g ,'');

	//Get query string as an object
	let queryStringObject = parsedUrl.query;

	//Get the Http method
	let method = req.method.toLowerCase();

	//Get the headers as an object
	let headers = req.headers;

	//Get the payload
	let decoder = new StringDecoder('utf-8');
	let buffer = '';

	req.on('data', (data) => {
		buffer += decoder.write(data);
	});

	req.on('end', () => {
		buffer += decoder.end();

		//Choose the handler this request should go to or notFound handler
		let chosenHandler = typeof(router[trimmedpath]) !== 'undefined' ? router[trimmedpath] : handlers.notFound;

		//Construct the dataobject to send to the handler
		let data = {
			'trimmedpath' : trimmedpath,
			'queryStringObject' : queryStringObject,
			'method' : method,
			'headers' : headers,
			'payload' : buffer
		};

		//Route the request to the handler specified in the router
		chosenHandler(data,(statusCode, payload) => {
			//Use the status code returned by the handler, default to 200
			statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
			//Use the payload called back by the handler or default to an empty object
			payload = typeof(payload) == 'object' ? payload : {};
			//Convert object to string
			let payloadString  = JSON.stringify(payload);
			//Return the response
			res.setHeader('Content-Type', 'application/json');
			res.writeHead(statusCode);
			res.end(payloadString);

			//Log the request
			console.log('Returning this response: ', statusCode, payloadString);
		});
	});
};

//Define handlers
let handlers = {};

//Ping handler
handlers.ping = (data, callback) => {
	callback(200);
};

//Greetings handler
handlers.greeting = (data, callback) => {
	data = {'greeting' : 'Hello there'}
	callback(200, data);
};

//Default handler
handlers.notFound = (data, callback) => {
	callback(404);
};

//Define a request router
let router = {
	'ping' : handlers.ping,
	'hello' : handlers.greeting
};
