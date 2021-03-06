var express = require('express');
var bodyParser = require('body-parser');
var cheerio = require('cheerio');
var request = require('request');
var app = express();
var tidy = require('htmltidy2').tidy;
var _ = require('underscore');

var URL = require('url-parse');

// instruct the app to use the `bodyParser()` middleware for all routes
app.use(bodyParser());

app.get('/', function(req, res) {
  // The form's action is '/' and its method is 'POST',
  // so the `app.post('/', ...` route will receive the
  // result of our form
  var html = '<form action="/" method="post">' +
               'Enter url:' +
               '<input type="text" name="url" placeholder="http://www.google.com" />' +
               '<br>' +
               '<button type="submit">Submit</button>' +
             '</form>';
  res.send(html);
});

// This route receives the posted form.
// As explained above, usage of 'body-parser' means
// that `req.body` will be filled in with the form elements
app.post('/', function(req, res) {
  var pageToVisit = req.body.url;
  var url = new URL(pageToVisit);

  var options = {
      url: pageToVisit,
      method: 'GET'
  };

  request(options, function(error, response, html) {
     if(error) {
       console.log("Error: " + error);
     }
     // Check status code (200 is HTTP OK)
     if(response.statusCode === 200) {
       var $ = cheerio.load(html);
       var body = $("html");
   
       var head = '<head><title>urlcrawler</title>' +
         '<link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css">' +
         '<script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script>' +
         '<script type="text/javascript" src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script>' +
         '</head>';
       var html = head + '<body> Fetch URL: ' + pageToVisit + '<br>' +
         '<a href="/">Try again.</a>';

       var tagCount = [];
       var tagCountHTML = '<div><ul class="list-group">';

       $('*').each(function(index, element) {
         if (tagCount[element.name] === undefined) {
           tagCount[element.name] = 1;
         } else {
           tagCount[element.name]++;
         }
       });
       for (var element in tagCount) {
         tagCountHTML += '<li class="list-group-item">' + '<a name =\"' + element + '\" onclick="highlight(this)"/>' + element + '&emsp;' + '<span class="badge">' + tagCount[element] + '</span> </li> </div>';
       }
       tagCountHTML += '</ul>';

       var childrens = $('*')[0].children;

       var json = {
		  "indent": "auto",
		  "indent-spaces": 2,
		  "wrap": 80,
		  "markup": true,
		  "output-xml": false,
		  "numeric-entities": true,
		  "quote-marks": true,
		  "quote-nbsp": false,
		  "show-body-only": false,
		  "quote-ampersand": false,
		  "break-before-br": true,
		  "uppercase-tags": false,
		  "uppercase-attributes": false,
		  "drop-font-tags": true,
		  "tidy-mark": false
		};
		  var result = "<xmp>" + getHtmlBody(body) + "</xmp>";
		  tidy(result, json, function(err, tidyhtml) {
			html += tagCountHTML;
       		html += '<div>Source view:</div>' + '<div id="source"><pre><code>' + tidyhtml + '</code></pre></div>';
      		html += getHighlightScript();
       		html += '</body>'
       		res.send(html);
		});


     }
  });
});

function getHighlightScript() {
  return (
    `
      <script>
        function highlight(element) {
          var highlightTag = element.name;
          $("#source").find("div").css("border", "");
          $("."+highlightTag).css("border", "13px solid yellow");
        }
      </script>
    `
  );
}

function getHtmlBody(childrens) {
  console.log("childrens", childrens)
  var outputContent = '';
  if (childrens == null) {
  	return outputContent;
  }
  for (var i = 0; i < childrens.length; i++) {
    if (childrens[i].type == 'text') {
      outputContent += _.escape(childrens[i].data);
    } else {
      var tagName = childrens[i].name;
      if (tagName != null) {
	      outputContent += '<div class=' + tagName + '>' + _.escape('<' + tagName + '>') + '</div>' + getHtmlBody(childrens[i].children) + '<div class=' + tagName + '>' + _.escape('</' + tagName + '>') + '</div>';
	  }
    }
  }
  return outputContent;
};

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});