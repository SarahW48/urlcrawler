var express = require('express');
var bodyParser = require('body-parser');
var cheerio = require('cheerio');
var request = require('request');
var app = express();

var URL = require('url-parse');

// instruct the app to use the `bodyParser()` middleware for all routes
app.use(bodyParser());

app.get('/', function(req, res){
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
       // Parse the document body

       var $ = cheerio.load(html);
       console.log('$', $);
       //var head = $('head');
       //head = '<title>urlcrawler</title><link rel="stylesheet" type="text/css" href=""><script type="text/javascript" src=""></script>';
       var body = $('body').toString();
       //console.log('head', head);

       //$.append(head);
       while (body.indexOf("script") !== -1) {
         var start = body.indexOf("script");
         var end = body.indexOf("/script") + 7;
         var filteredBody = body.slice(0, start-1) + body.slice(end+1, body.length);
         body = filteredBody;
       }

       var head = '<head><title>urlcrawler</title><link rel="stylesheet" type="text/css" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css"><script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script><script type="text/javascript" src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js"></script></head>';
       var html = head + '<body> Fetch URL: ' + pageToVisit + '<br>' +
         '<a href="/">Try again.</a>';

       var tagCount = [];
       var tagCountHTML = '<div>';
      // html = head+body;
       //$ = cheerio.load(body);
       // console.log('$2', $);
       $('*').each(function(index, element) {
         if (tagCount[element.name] === undefined) {
           tagCount[element.name] = 1;
         } else {
           tagCount[element.name]++;
         }
       });
       for (var element in tagCount) {
         tagCountHTML += '<div>Name of Tag: ' + '<a name =\"' + element + '\" onclick="highlight(this)"/>' + element + ' Count:' + tagCount[element] + '</div>';
       }
       tagCountHTML += '</div>';
       console.log(tagCountHTML);
       var childrens = $('*')[0].children;
       console.log('childrens', childrens);
       console.log('*', $('*'));


       html += tagCountHTML;
       var sourceHtmlRenderBody = getHtmlBody.call(this, childrens);
       html += '<div>Source view:</div> <div id="source">' + sourceHtmlRenderBody + '</div>';
       html += getHighlightScript(sourceHtmlRenderBody.toString());
       html += '</body>'
       res.send(html);
     }
  });
});

function getHighlightScript(sourceHtml) {
  return (
    `
      <script>
        function highlight(element) {
          console.log(element.name);
          var sourceHtml = '${sourceHtml}';
          var highlightTag = element.name;
          var convertHtml = sourceHtml.split("<xmp><"+highlightTag+"></xmp>")
            .join("<xmp style=\\"background-color: yellow;\\"><" + highlightTag + "></xmp>");
          document.getElementById("source").innerHTML = convertHtml;
          console.log(convertHtml);
        }
      </script>
    `
  );
}

function getHtmlBody(childrens) {
  var outputContent = '';
  for (var i = 0; i < childrens.length; i++) {
    if (childrens[i].type == 'text') {
      outputContent += childrens[i].data;
    } else {
      var tagName = childrens[i].name;
      outputContent += '<xmp><' + tagName + '></xmp>' + getHtmlBody(childrens[i].children) + '<xmp><' + tagName + '/></xmp>';
    }
  }
  return outputContent;
};

app.listen(3000, function() {
  console.log('Example app listening on port 3000!');
});