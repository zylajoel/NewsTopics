
/**
 * Module dependencies.
 */

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
   , LocalStrategy = require('passport-local').Strategy;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(logfmt.requestLogger());
app.use(express.static(path.join(__dirname, 'public')));


// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);
app.get('/datamonitor', routes.datamonitor);

http.createServer(app).listen(app.get('port'), function(){
  console.log('newsTwist server listening on port ' + app.get('port'));
});



// Authenticate Users

app.post('/login',
  passport.authenticate('local', { successRedirect: '/login',
                                   failureRedirect: '/poop' })
);

passport.use(new LocalStrategy({
      emailField: 'email',
      passwordField: 'passw',
   },
function (emailField, passwordField, done) {
   process.nextTick(function () {
      db.collection(users, function (error, collection) {
         if (!error) {
            collection.findOne({
               'email': emailField,
               'password': passwordField // use there some crypto function
            }, function (err, user) {
               if (err) {
                  return done(err);
               }
               if (!user) {
                  console.log('this email does not exist');
                  return done(null, false);
               }
                  return done(null, user);
            });
         } else {
            console.log(5, 'DB error');
         }
      });
   });
}));


// Get news data and insert in database
var uristring = 
  process.env.MONGOLAB_URI || 
  process.env.MONGOHQ_URL || 
  'mongodb://heroku_app23495772:6dv4rti8nij007hn89t0strkba@ds035557.mongolab.com:35557/heroku_app23495772';

var timeInterval = setInterval(getNews, 1 * 60 * 1000);

function getNews() {
   console.log('');
   console.log('**************************************')
   console.log('******** Scraping Google News ********');

   var url = 'http://news.google.com'
      , json = {};

   request(url, function(err, resp, body) {

      if (err) {
         throw err;
      }

      $ = cheerio.load(body);

      json.stories = [];

      $('.story').each(function() {

         var theStory = $(this).find('.story .esc-lead-article-title-wrapper a.article .titletext').text() || "";

         if (theStory.length) {

            var story = {};

            story.title = theStory;

            story.href = $(this).find('.story .esc-lead-article-title-wrapper a.article').attr('url') || "";

            story._id = md5(story.href);

            story.source = $(this).find('.story .esc-lead-article-source-wrapper .al-attribution-source').text() || "";

            story.intro = $(this).find('.story .esc-lead-snippet-wrapper').text() || "";

            story.related = [];

            $(this).find('.story .esc-extension-wrapper .esc-secondary-article-wrapper').each(function() {

               var theRelatedStory  = $(this).find('.esc-secondary-article-title-wrapper a.article .titletext').text() || "";

               if (theRelatedStory.length) {

                  var relatedStory = {};

                  relatedStory.title = theRelatedStory;

                  relatedStory.href = $(this).find('.esc-secondary-article-title-wrapper a.article').attr('href') || "";

                  story.related.push(relatedStory);
               }
            });

            json.stories.push(story);
         }
      });

      mongo.connect(uristring, function (err, db) {
         if (err) { 
            console.log ('ERROR connecting to: ' + uristring + '. ' + err);
         } else {
            console.log ('Succeeded connected to: ' + uristring);
            //db.collection('test', function(err, collection) {});
            //db.createCollection('test', {w:1}, function(err, collection) {});
            //db.collection('test', {w:1}, function(err, collection) {});

            db.createCollection('stories', function(err, collection) {});
           
            var collection = db.collection('stories');

            var doc2 = {'test2': 'doc2'};

            var stories = json.stories;

            //collection.insert(doc2, {w:1}, function(err, result) {});
            collection.insert(stories, {continueOnError: true}, function(err, result) {
               if (err) {
                  console.log('ERROR inserting stories.' + err);
               } else {
                  console.log('********Succeeded inserted stories********');
               }
            });
         }
      });
   });
}
