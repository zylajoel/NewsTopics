
/*
 * GET home page.
 */

var request = require('request')
   , cheerio = require('cheerio')
   , express = require('express')
   , logfmt = require('logfmt')
   , md5 = require('MD5');


exports.index = function(req, res){
  res.render('index');
};


exports.topics = function(req, res) {
   var json = {
      'username': req.user.name
   }
   res.render('topics', json);
};


exports.registration = function(req, res){
  res.render('register');
};


exports.registerUser = function(req, res){
   var  mongo = require('mongodb')
      , crypto = require ('crypto');

   var user = {
      "name": req.body.name,
       "email": req.body.email,
       "password": req.body.password
   };

   var uristring = 
     process.env.MONGOLAB_URI || 
     process.env.MONGOHQ_URL || 
     'mongodb://heroku_app23495772:6dv4rti8nij007hn89t0strkba@ds035557.mongolab.com:35557/heroku_app23495772';


  
   var iterations = 1000;
   var keylen = 24
   var salt = crypto.randomBytes(128).toString('base64'); // salt
  
   var callback = function(err, key){
      var hexHash = Buffer(user.password, 'binary').toString('hex');
      // do something with the hashed password
      user.password = hexHash;
      user.salt = salt;
   
      mongo.connect(uristring, function (err, db) {
         if (err) { 
         } else {
            var collection = db.collection('users');

            collection.insert(user, function(err, result) {
               if (err) {
                  res.redirect('register');
               } else {
                  req.login(user, function(err) {
                    if (err) {
                      res.redirect('register');
                    }
                    return res.redirect('topics');
                  });
               }
            });
         }
      });
   };
  
  crypto.pbkdf2(user.password, salt, iterations, keylen, callback);

};
