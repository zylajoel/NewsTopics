
var express = require('express')
   , request = require('request')
   , cheerio = require('cheerio')
   , routes = require('./routes')
   , http = require('http')
   , path = require('path')
   , app = express()
   , logfmt = require('logfmt')
   , md5 = require('MD5')
   , mongo = require('mongodb')
   , passport = require('passport')
   , LocalStrategy = require('passport-local').Strategy
   , ParseNews = require('parse-news')
   , crypto = require('crypto');

app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
//app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.session({ secret: 'keyboard cat'}));
app.use(logfmt.requestLogger());
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);

if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}



/**
 * User Authentication
 */

var uristring = 
  process.env.MONGOLAB_URI || 
  process.env.MONGOHQ_URL || 
  'mongodb://heroku_app23495772:6dv4rti8nij007hn89t0strkba@ds035557.mongolab.com:35557/heroku_app23495772';

passport.use(new LocalStrategy({usernameField: 'email', passwordField: 'password'}, function (userId, password, done) {
   mongo.connect(uristring, function (err, db) {
      db.collection("users", function(err, collection) {
         if (!err) {
            collection.findOne({
               'email': userId
            }, function (err, user) {
               if (err) {
                  return done(err);
               }
               if (!user) {
                  return done(null, false);
               }
               var iterations = 1000
                 , keylen = 24
                 , salt = user.salt;

               var callback = function(err, key){
                  var hexHash = Buffer(password, 'binary').toString('hex');
                  if (hexHash !== user.password) {
                     return done(null, false);
                  } else {
                     return done(null, user);
                  }
               };
               crypto.pbkdf2(password, salt, iterations, keylen, callback);
            });
         } else {
            console.log(5, 'DB error');
         }
      });
   }); 
}));

passport.serializeUser(function(user, done) {
  done(null, user);
});
 
passport.deserializeUser(function(user, done) {
  done(null, user);
});



/**
 * Routes
 */

app.get('/', routes.index);

app.get('/register', routes.registration);
app.post('/register', routes.registerUser);

app.get('/topics', loggedIn, routes.topics);

app.post('/login', passport.authenticate('local'), function(req, res) {
   res.redirect('/topics');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});



/**
 * Functions
 */

// Check if user is logged in
function loggedIn(req, res, next) {
  if (req.user) {
    next();
  } else {
    res.redirect('/');
  }
};

// Get news and insert in database
ParseNews.google();



/**
 * Start server
 */

http.createServer(app).listen(app.get('port'), function(){
  console.log('newsTwist server listening on port ' + app.get('port'));
});
