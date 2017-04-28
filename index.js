'use strict';

require('dotenv').config();
const express = require('express');
const chalk = require('chalk');
const Base62 = require('base62');
const fnv = require('fnv-plus');
const moment = require('moment');
const {MongoClient}= require('mongodb');


// listen on port set in env in deveopment or just port 80 if no env files exist
const port = process.env.PORT || 80;

const app = express();

app.get('/new/*', (req, res) => {

  // test code
  res.send({ 'hash' : encode(req.params[0]) });

});

app.get('/:id', (req, res) => {

  res.send(req.params);

});

app.get('/', (req, res) => {

  const dbAddress = `mongodb://${process.env.DBUSER}:${process.env.DBPASSWORD}@ds113871.mlab.com:13871/url-shortener-ms`;
  console.log(dbAddress);
  MongoClient.connect(dbAddress, (err, db) => {
    if (err) {
      return console.log('Could not connect to database!');
    }
    db.collection('urls').find().sort({'timestamp': -1}).limit(5).toArray().then((docs) => {
      console.log(docs);
      //TODO: send to template
    });
  });


  res.end('TODO: Home Page');

});

app.listen(port, () => {
  console.log(chalk.yellow(`Listening on port: ${port}`));
});


// generate a hash by first taking a string + timestamp and hashing it with the
// FNV algorithm, then chaging that integer to base62.
// May not be unique.
function encode(string) {

    // add unix timestamp to string
    const seededString = moment().format('x') + string;

    // FNV then Base62
    const hash = Base62.encode(fnv.hash(seededString).dec());

    return hash;
}
