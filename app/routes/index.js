'use strict';

var path = process.cwd();
var Poll = require('../models/polls.js');

module.exports = function (app, passport) {

	function isLoggedIn (req, res, next) {
		if (req.isAuthenticated()) {
			return next();
		} else {
			res.redirect('/');
		}
	}

	app.route('/')
		.get(function (req, res) {
			Poll.find({}).sort('-date').limit(10).exec(function(err, posts){
				if(err) throw err;
				
			    res.render("index", {
					recentPolls: posts.map((val) => {
						return {
							name: val.name,
							id: val._id
						};
					}),
					isLoggedIn: req.isAuthenticated()
				});
			})
			
			
		});

	app.route('/poll/:id')
		.get(function (req, res) {
			Poll.findOne({ _id: req.params.id }).exec(function(err, doc) {
				if(err) throw err;
				
				let options = doc.options;
				
				res.render("poll-vote", {
					name: doc.name,
					options: options.map((val, i) => {
						return {
							optionId: i,
							optionName: val.name
						};
					}), // optionIds
					pollId: req.params.id,
					isLoggedIn: req.isAuthenticated(),
					url: process.env.APP_URL + "poll/" + req.params.id
				});
			});
			
		});

	app.route('/poll-results/:id')
		.get(function (req, res) {
			Poll.findOne({ _id: req.params.id }).exec((err, poll) => {
				if(err) throw err;
				
				res.render("poll-results", {
					options: poll.options.map((val, i) => {
						return {
							optionId: i,
							optionName: val.name,
							votes: val.votes
						};
					}),
					name: poll.name,
					url: process.env.APP_URL + "poll/" + req.params.id,
					pollId: req.params.id,
					isLoggedIn: req.isAuthenticated()
				});
			});
			
		});
		
	app.route('/my-polls')
		.get(isLoggedIn, function (req, res) {
			Poll.find({ user: req.user.github.id }).exec((err, polls) => {
				if(err) {
					throw err;
				}
				
				res.render("my-polls", {
					polls: polls, // name: pollId
					isLoggedIn: req.isAuthenticated()
				});
			});
			
			
		});
		
	app.route('/create-poll')
		.get(isLoggedIn, function (req, res) {
			res.render("create-poll", {
				isLoggedIn: req.isAuthenticated()
			});
		});


	// API
	
	app.route('/api/create')
		.post(isLoggedIn, function (req, res) {
			let userId = req.user.github.id;
			
			// Validate
			if(req.body.name && req.body.options[0] && req.body.options[1]) {
				let poll = new Poll();
				poll.user = userId;
				poll.name = req.body.name;
				poll.options = req.body.options.map((val, i) => {
									return {
										votes: 0,
										name: val
									};
								});
				
				console.log(poll);
				
				poll.save(function (err) {
					if (err) {
						throw err;
					}
					res.redirect("/poll/" + poll._id);
				});
			}
		});
		
	app.route('/api/update/:id')
		.post(isLoggedIn, function (req, res) {
			if(!req.body.optionName) {
				return res.redirect("/poll/" + req.params.id);
			}
			
			Poll.findOne({ _id: req.params.id }).exec((err, poll) => {
				if(err) throw err;
				
				poll.options.push({
					votes: 1,
					name: req.body.optionName
				});
				
				poll.save(function (err) {
					if (err) {
						throw err;
					}
					res.redirect("/poll-results/" + poll._id);
				});
			});
		});
		
	app.route('/api/vote/:pollId/:optionId')
		.get(function (req, res) {
			Poll.findOne({ _id: req.params.pollId }).exec((err, poll) => {
				if(err) throw err;
				
				poll.options[req.params.optionId].votes += 1;
				
				poll.save(function (err) {
					if (err) {
						throw err;
					}
					res.redirect("/poll-results/" + poll._id);
				});
			});
		});
		
	app.route('/api/delete/:id')
		.get(isLoggedIn, function (req, res) {
			// Check that poll is owned by user logged in
			Poll.findOne({ _id: req.params.id }).exec((err, poll) => {
				if(poll.user == req.user.github.id) {
					Poll.findOneAndRemove({'_id' : req.params.id}, function (err,poll){
			    		res.redirect('/my-polls');
		    		});
				}
			});
			
			// Delete poll
			
			// Redirect to my-polls
		});

	app.route('/auth/github')
		.get(passport.authenticate('github'));

	app.route('/auth/github/callback')
		.get(passport.authenticate('github', {
			successRedirect: '/',
			failureRedirect: '/'
		}));
		
	app.route('/logout')
		.get(function (req, res) {
			req.logout();
			res.redirect('/');
		});
};
