const db = require('../js/database');
const ResponseMessage = require('../error/ResponseMessage').ResponseMessage;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');





var addUser = function (req, res) {
	var name = req.body.username;
	var password = req.body.password;
	if (name && password) {
		bcrypt.hash(password, 10, (err, hash) => {
			if (err) throw err;
			db.User.create({
				username: name,
				password: hash
			}).then(user => {
				res.json(new ResponseMessage(200, "User Added"));
			}).catch(err => {
				res.json(new ResponseMessage(400, "Something went wrong"));
			});

		});
	} else {
		res.json(new ResponseMessage(400, "Invalid Params"));
	}
};


var checkUser = function (req, res) {
	var name = req.body.username;
	var password = req.body.password;
	if (name && password) {
		db.User.findOne({
			where: {
				username: name
			}
		}).then(user => {

			if (user == null) {
				res.json(new ResponseMessage(400, "Invalid Credentials"));
			} else {

				bcrypt.compare(password, user.password, (err, result) => {
					if (err) {

					}
					
					// res == true or res == false
					if (result == true) {
						const token = jwt.sign({ sub: user.id }, config.development.secret);
						var message=new ResponseMessage(200, "Welcome " + name);
						message["token"]=token;
						res.json(message);
					} else {
						res.json(new ResponseMessage(400, "Invalid Credentials"));
					}
				});
			}

		}).catch(err => {
			console.error(err);
			res.json(new ResponseMessage(400, err));
		});
	} else {
		res.json(new ResponseMessage(400, "Invalid Params"));
	}
};

exports.routes = {
	getUsers: getUsers,
	checkUser: checkUser,
	addUser: addUser,
	deleteUser: deleteUser
};