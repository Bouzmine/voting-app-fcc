'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Poll = new Schema({
	name: String,
	options: [
	    {
	        votes: Number,
	        name: String
	    }
	],
    user: String
});

module.exports = mongoose.model('Poll', Poll);
