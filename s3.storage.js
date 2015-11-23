var amazonS3Storage = {
	bucketName : null,
	repoUser : null,
	dataFile : "data.json",
	getBucketInfo : function(endpoint) {
		var result = {};
		var parser = document.createElement('a');
		parser.href = endpoint;

		var pathInfo;
		pathInfo = parser.pathname.split("/");
		if (parser.pathname.indexOf("/") === 0) {
			pathInfo.shift();
		}

		if (parser.hostname.indexOf("s3-website-eu-west-1.amazonaws.com") !== -1) {
			result.bucketName = parser.hostname.split(".")[0];
		}

		return result;
	},
	checkJail : function(url) {
		var repo1 = this.getBucketInfo(url);
		var repo2 = this.getBucketInfo(this.endpoint);
		
		if (
			(repo1.bucketName == repo2.bucketName)
		) {
			return true;
		}
		return false;
	},
	init : function(endpoint) {
		if (endpoint === null) {
			endpoint = document.location.protocol + "//" + document.location.hostname + "/";
		}
		var script = document.createElement("SCRIPT");
		script.src = "https://sdk.amazonaws.com/js/aws-sdk-2.2.18.min.js";
		document.head.appendChild(script);

		var bucketInfo = this.getBucketInfo(endpoint);
		this.bucketName = bucketInfo.bucketName;

		this.endpoint = endpoint;
		this.dataFile = "data/data.json";

		this.sitemap = editor.storageConnectors.default.sitemap;
		this.listSitemap = editor.storageConnectors.default.listSitemap;
	},
	connect : function() {
		if (typeof AWS === "undefined") {
			return false;
		}
		
		AWS.config.region = "eu-west-1";
		
		if (!editor.storage.key) {
			editor.storage.key = localStorage.storageKey;
		}
		if (!editor.storage.key) {
			editor.storage.key = prompt("Please enter your authentication key");
		}

		if (editor.storage.validateKey(editor.storage.key)) {
			AWS.config.update({accessKeyId: '...', secretAccessKey: editor.storage.key});
			if (!this.bucket) {
				localStorage.storageKey = editor.storage.key;
				this.bucket = new AWS.S3({params: {Bucket: this.bucketName}});
			}
			return true;
		} else {
			return editor.storage.connect();
		}
	},
	disconnect : function() {
		delete this.bucket;
		delete localStorage.storageKey;
	},
	validateKey : function(key) {
		return true;
	},
	save : function(data, callback) {
		var saveCallback = function(err) {
			if (err === null) {
				return callback();
			}

			if (err.error == 401) {
				return callback({message : "Authorization failed."});
			}
			return callback({message : "Could not store."});
		};
		var params = {Key: this.dataFile, Body: data};
		this.bucket.putObject(params, function (err, data) {
			saveCallback(err);
		});
	},
	load : function(callback) {
		var http = new XMLHttpRequest();
		var url = this.endpoint + this.dataFile;

		if (editor.profile == "dev") {
			url += "?t=" + (new Date().getTime());
		}
		http.open("GET", url, true);
		http.onreadystatechange = function() {//Call a function when the state changes.
			if(http.readyState == 4 && http.status == 200) {
				callback(http.responseText);
			}
			if(http.readyState == 4 && http.status == 404) {
				callback("{}");
			}
		};
		http.send();
	}
};
