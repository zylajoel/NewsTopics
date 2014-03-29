
/*
 * GET home page.
 */

var request = require('request')
   , cheerio = require('cheerio')
   , express = require('express')
   , logfmt = require("logfmt")
   , md5 = require('MD5');

exports.googlenews = function(req, res) {
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

            story.storyID = md5(story.title);

            console.log(story.storyID);

            story.href = $(this).find('.story .esc-lead-article-title-wrapper a.article').attr('url') || "";

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

      res.json(json);
   });
};

// exports.googlenews1 = function(req, res) {
//    var url = 'http://news.google.com'
//    , json = {};

//    request(url, function(err, resp, body) {

//       if (err) {
//          throw err;
//       }

//       $ = cheerio.load(body);

//       json.stories = [];

//       $('.story').each(function() {

//          var theStory = $(this).find('.story .esc-lead-article-title-wrapper a.article .titletext').text() || "";

//          if (theStory.length) {
//             var realTimeCoverage = $(this).find('.story a.esc-fullcoverage-button').attr('href') || ""
//             console.log(realTimeCoverage);
//          }
//       });

//       res.json(json);
//    });
// };

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};
