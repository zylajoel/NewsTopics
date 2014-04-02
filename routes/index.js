
/*
 * GET home page.
 */

var request = require('request')
   , cheerio = require('cheerio')
   , express = require('express')
   , logfmt = require("logfmt")
   , md5 = require('MD5');

exports.datamonitor = function(req, res) {
   var url = 'http://news.google.com'
   , mongoose = require ("mongoose")
   , json = {};

   request(url, function(err, resp, body) {

      if (err) {
         throw err;
      }


   });
};

exports.index = function(req, res){
  res.render('index', { title: 'Express' });
};
