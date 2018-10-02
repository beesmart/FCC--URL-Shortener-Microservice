'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const app = express();

const mongooseURI = process.env.MONGO_URI;
mongoose.connect(mongooseURI, { useMongoClient: true });
const db = mongoose.connection;
const Schema = mongoose.Schema;
// check connection errors
db.on('error', console.error.bind(console, 'connection error:'));
// Basic Configuration 
const port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}))
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

const urlSchema = new Schema({
  originalUrl: {
      type: String,
      required: true,
      unique: true
  },
  shortenedUrl: String
}, {timestamps: true});

const shortUrl = mongoose.model('shortUrl', urlSchema);


app.post('/api/shorturl/new', function (req, res) {
  let trimmedBody = req.body.url.replace(/^http(s?):\/\//i, "");
  dns.lookup(trimmedBody, (err, address, family) => {
    if(err){
      res.json({ error: "invalid URL"  })
    } else {
      var newShortUrl = Math.floor(Math.random()*1000000).toString();
      
      var data = new shortUrl({
        originalUrl: req.body.url,
        shortenedUrl: newShortUrl
      })
      
      data.save(err=>{
        if(err){
          return res.send('Error saving to Db');
        } else {
          res.json({ originalUrl: req.body.url, shortUrl: newShortUrl })
        }
      })          
    }
  });
  
})

// Check db and route

app.get('/api/shorturl/:urlToRedirect', function(req, res, next){
   var shorterUrl = req.params.urlToRedirect;
   shortUrl.findOne({ shortenedUrl: shorterUrl }, function (err, data) { 
        if (err){ return res.send('Error reading Db')} 
        else {
          var regCheck = new RegExp("^(http|https)://", "i");
          var checkString = data.originalUrl;
          
          if(regCheck.test(checkString)){
             res.redirect(301, data.originalUrl)
          } else {
            res.redirect(301, 'http://' + data.originalUrl);
          }
        }
   })
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});