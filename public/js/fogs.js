$(function() {

	///////////////////////////////////////////////////////
	//				Models & Collections
	///////////////////////////////////////////////////////

	
	// each fog is made up of individual posts
	window.Post = Backbone.Model.extend({
		idAttribute: "_id"
	});

	window.Posts = Backbone.Collection.extend({
		model: Post,
		initialize: function(models, options) {
			window.options = options;
			this.name = options.name;
		},
		url: function() { 
			return "/api/fog/" + this.name + "/posts";
		},
		comparator: function(post) {
			return (new Date(this.get("created")).getTime());
		}
	});

	// a fog is a collection of posts associated with a certain location and
	// access rights, stored in the metadata. 
	window.FogMeta = Backbone.Model.extend({
		idAttribute: "_id",
		url: function() { 
			if (this.isNew()) {
				// the model object will be included in the POST request
				return "/api/fog/new/";
			} else {
				// access specific fogs by their unique id once they've been
				// created
				return "/api/fog/" + this.id;
			}
		}
	});

	window.FogList = Backbone.Collection.extend({
		model: FogMeta,
		// when the create() method is called, backbone will visit the url of
		// the *model* (FogMeta) and POST to that url with the data being the
		// model body. if this is a regular GET request to list existing fogs,
		// then we'll hit '/api/fogs'/
		url: function() { 
			return '/api/fogs/location/'+user_lat+"/"+user_long+"/radius/"+this.radius;
		},
		toggle: 1,
		radius: 10
	});

	///////////////////////////////////////////////////////
	//                  Views
	///////////////////////////////////////////////////////


	window.PostView = Backbone.View.extend({
		events: {'click .deletepost' : 'deletePost'},

		initialize: function() {
			// any time a 'destroy' event is called, automatically invoke the
			// remove method, which removes the view's HTML from the DOM. 
			_.bindAll(this, 'render', 'deletePost');
			this.model.bind('destroy', this.remove, this);
			this.model.bind('change', this.render, this);
			this.template = _.template($('#post-template').html());
		},

		render: function() {
			// pass data to and render a template set up in the initialize method.
			var renderedContent = this.template(this.model.toJSON());
			$(this.el).html(renderedContent);
			return this;
		},

		deletePost: function(e) {
			// the view is instantiated with a specific model, so when
			// deletePost is called, we can access info about that model.
			this.model.destroy({
				success: function(){
					console.log("post successfully deleted");
				}, 
				error: function(){
					console.log("post deletion error"); 
				}
			});
			e.preventDefault();
		}
	});


	window.FogView = Backbone.View.extend({
		events: {"keypress #newpost": "submitOnEnter" },
		el: $("#container"),

		initialize: function(models, options) {
			// will trigger 'reset' event on this.model
			this.model.fetch({success: function() {
				console.log("succeessfully retrieved model");
			}, error: function(model, resp) {
				console.log("error retrieving model");
			}}, {wait: true});

			_.bindAll(this, 'render', 'addOne', 'addAll', 'submitOnEnter');
			// this.model is a FogMeta model
			this.model.bind('reset', this.render, this);
			this.model.bind('change', this.render, this);
			this.template = _.template($('#fogview-template').html());
			this.posts = new Posts([], {name: this.model.id});
			this.posts.bind('add', this.addOne);
			this.posts.bind('reset', this.addAll);

			// will trigger 'reset' event on this.posts
			this.posts.fetch({success: function() {
				console.log("succeessfully retrieved posts for model");
			}, error: function() {
				console.log("error retrieving posts for model");
			}}, {wait: true});
		},

		render: function() {
			// inject the html for the metadata
			// why is render being called so many times? uncomment the console log to see...
			console.log("fogView.render");
			console.log(this.model.toJSON());
			console.log(this.model);
			$(this.el).html(this.template(this.model.toJSON()));
			// instead of using the following line, SET el to be equal to
			// $("#container"). otherwise, you lose the event handler (for some
			// reason). 
			//$("#container").html(this.el);
			return this;
		},

		submitOnEnter: function(event) {
			if (event.keyCode == 13) {
				var postdata = this.$("#newpost").val();
				// create() call will trigger an add event on the posts
				// collection, which we registered in the initialize function
				// to trigger this.addOne(). 
				this.posts.create({
					content: this.$('#newpost').val(),
					created: Date()
				});
				this.$('#newpost').val('');
			}
		},

		addOne: function(postData) {
			var view = new PostView({model:postData});
			$('#posts').prepend(view.render().el);
		},

		addAll: function() {
			this.posts.each(this.addOne);
		}
	});
	
	window.FogMetaView = Backbone.View.extend({
		events: {'click .deletefog' : 'deleteFog',
				'click .foglink' : 'foglink'},

		initialize: function () { 
			// any time a 'destroy' event is called, automatically invoke the
			// remove method, which removes the view's HTML from the DOM. 
			this.model.bind('destroy', this.remove, this);

			// initialize the template's HTML
			this.template = _.template($('#fogmeta-template').html()); 
		},

		foglink: function(e) {
			// click handler to trigger routes
			// note: using this.$('.foglink') versus just $('.foglink') grabs
			// the item with class foglink in "this" object versus just
			// randomly off the page, which is impt. since we need the correct
			// url. 
			// to properly use routes and pushstate we need to override the
			// link element's behaviour to use our javascript instead of having
			// the browser *actually* visit the url. 
			// see https://github.com/documentcloud/backbone/issues/456
			console.log('fogLink click handler invoked');
			// prevent the default on the event
			e.preventDefault(); 
			approuter.navigate(this.$('.foglink').attr('href') , {trigger: true});
		},

		render: function () { 
			console.log("FogMetaView.render()");
			$(this.el).html(this.template(this.model.toJSON()));
			return this;
		},

		deleteFog: function(e) {
			// the view is instantiated with a specific model, so when
			// deleteFog is called, we can access info about that model.
			this.model.destroy();
			e.preventDefault(); 
		}
	});

	// this is basically the FogListView
	window.HomeView = Backbone.View.extend({
		events: { 'click #submit':  'createFog', 
				'click #sortrecent': 'sortRecent',
				'click #updatesearch': 'updateSearch',
				'click #sortclosest': 'sortClosest'
		},

		initialize: function() {

			// default search radius for nearby fogs
			var search_radius = 100;
		
			this.template = _.template($('#newfog-template').html());
			// the binding of the 'all' event tells backbone to call render() on
			// ALL triggered events. the addOne event adds html to the DOM so
			// that when the view is re-rendered there is new HTML there.
			// similarly with the addAll(). 
			// the call to bindAll fixes the reference to 'this', while the
			// calls to bind() set the actual event callbacks.
			// bindAll is called on render because render is (often) triggered
			// based on an event, and we want it to run within the context of
			// the view (ie, "this").
			_.bindAll(this, 'render', 'addOne', 'addAll');
			fogList.bind('add', this.addOne);
			fogList.bind('all', this.render);
			// the reset event is used when loading pre-existing fogs 
			fogList.bind('reset', this.addAll);
			console.log('initializing HomeView');
		},

		render: function() {
			console.log('render HomeView');
			// this.$('#divid') versus $(this.el) versus this.$el versus
			// $('#divid').html(...) versus $(el) versus...?!
			$(this.el).html(this.template({}));
			return this;
		},

		updateSearch: function(e) {
			fogList.radius = $("#newrange").val();
			fogList.fetch();
			e.preventDefault();
		},

		// gets the information from the form fields and creates a new fog data
		// model with it. creating the new fog will implicitly call
		// this.addOne(), below, and thusly also trigger the 'all' event,
		// causing the template to re-render. 
		createFog: function(e) {
			if (!location_error) {
				var nameField = $('#name');
				var radiusField = $('#radius');
				var expiryField = $('#expiry');
				console.log("using current location = " + user_lat+", "+user_long);

				fogList.create({
					name: nameField.val(),
					radius: radiusField.val(),
					expiry: expiryField.val(),
					location: [user_lat, user_long],
					created: Date()
					}, {wait: true});
			} else {
				console.log('geolocation not supported.');
			} 

			// return false so the form doesn't actually get submitted (we want
			// to keep routing and state control managed within javascript not
			// the browser). 
			e.preventDefault();
		},

		// sorting the collection will trigger a change event
		sortRecent: function(e) {
			console.log("sorting by most recent");
			fogList.toggle *= (-1);
			fogList.comparator = function(fog) {
				return (this.toggle)*new Date(fog.get("created")).getTime();
			}
			// re-sort and trigger the reset event
			fogList.sort();
			e.preventDefault();
		},

		sortClosest: function(e) {
			console.log("sorting by distance");
			fogList.toggle *= (-1);
			fogList.comparator = function(fog) {
				return fog.get("radius");
			}
			e.preventDefault();
		},

		// add the dom markup for a new fog item
		addOne: function(f) {
			// TODO insert it into the right place, depending on sort order (do
			// we care?)
			var view = new FogMetaView({model:f});
			$('#foglist').prepend(view.render().el);
		},

		addAll: function() {
			// remove the current listing before reseting the fog list. 
			$('#foglist').html("");
			fogList.each(this.addOne);
		}

	});

	var AppRouter = Backbone.Router.extend({
	
		routes: {
			"": "home",
			"fog/:fogid": "fogpage",
			"help": "help"
		},

		home: function() {

			window.fogList = new FogList();

			// set up some 
			geo_success = function(position) {
				// save the user's position as a global variable 
				user_lat = position.coords.latitude;
				user_long = position.coords.longitude;
				console.log("obtained user location (" + user_lat + "," + user_long + ")");
				location_error = false;

				// get or create the user's identity
				if (localStorage["geoscratch"]) {
					username = localStorage["geoscratch"]["username"];


				}

				fogList.fetch({success: function(collection, response) {
					console.log("retrieved models from server successfully!");
				}, error: function(collection, response) {
					console.log("error!");
					console.log(response);
				}});

				var Home = new HomeView();
				Home.render();
				// see this post: http://lostechies.com/derickbailey/2011/11/09/backbone-js-object-literals-views-events-jquery-and-el/
				// for why to structure the call to render and inject the html this way. 
				$("#fogform").html(Home.el);
			};

			geo_error = function(error) {
				console.log("Error, could not obtain location. Error " + error.code);
				$("fogform").html("Error, could not obtain user location.");
				location_error = true;
			};


			// start watching the user's location. 
			navigator.geolocation.watchPosition(
				geo_success, 
				geo_error, 
				{enableHighAccuracy:true}
			);
		},

		fogpage: function(fogid) {
			console.log("setting up view for " + fogid);
			var fogmeta = new FogMeta();
			fogmeta.id = fogid;
			var fogView = new FogView({model: fogmeta});
		},

		help: function() { }

	});

	showValue = function(newValue) {
		$("#searchradius").html(newValue);
	};

	var approuter = new AppRouter();
	Backbone.history.start({pushState: true});

});
