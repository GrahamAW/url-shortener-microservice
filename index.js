'use strict';

require('dotenv').config();
const express = require('express');
const chalk = require('chalk');
const Base62 = require('base62');
const fnv = require('fnv-plus');
const moment = require('moment');
const {
    MongoClient
} = require('mongodb');
const hbs = require('hbs');
const validUrl = require('valid-url');

const dbAddress = `mongodb://${process.env.DBUSER}:${process.env.DBPASSWORD}@ds113871.mlab.com:13871/url-shortener-ms`;
const appBaseUrl = 'https://evening-garden-85970.herokuapp.com/';


// listen on port set in env in deveopment or just port 80 if no env files exist
const port = process.env.PORT || 80;

const app = express();
app.use(express.static(__dirname + '/static'));
hbs.registerPartials(__dirname + '/views/partials');

hbs.registerHelper('url_list', (urls) => {
    const timeFormat = 'MMM-D-YYYY, h:mm a';
    const baseUrl = appBaseUrl;

    const urlsHTML = urls.map((url) => {
        const timeText = moment(url.timestamp).format(timeFormat);
        const longUrl = url.longUrl;
        const shortUrl = `${baseUrl}${url.shortUrl}`;
        return `<tr><td><a href='${longUrl}'>${longUrl}</a></td><td><a href='${shortUrl}'>${shortUrl}<a></td><td>${timeText}</td></tr>`;
    });
    return urlsHTML.join('');
});

// respond to reqeust to create new url
app.get('/new/*', (req, res) => {

    const orginalUrl = req.params[0];

    if (!validUrl.isUri(orginalUrl)) {
        return res.send({
            'error': 'Wrong url format, make sure you have a valid protocol and real site.'
        });
    }

    MongoClient.connect(dbAddress, (err, db) => {
        if (err) {
            res.end('Could not connect to database');
            return console.log(chalk.red('Database error.'));
        }

        getUniqueHash(orginalUrl).then((hash) => {
            const url = {
                'shortUrl': hash,
                'longUrl': orginalUrl,
                'timestamp': parseInt(moment().format('x'))
            };

            db.collection('urls').insertOne(url, (err, doc) => {
                if (err) {
                    res.end('Could not insert into database');
                    return console.log(chalk.red('Database error.'));
                }
                // TODO: better formatting of results
                const result = {
                    'orginal_url': doc.ops[0].longUrl,
                    'short_url': appBaseUrl + doc.ops[0].shortUrl
                };

                res.send(result);
            });
        });
    });
});

app.get('/:id', (req, res) => {
    // check datebase for url
    MongoClient.connect(dbAddress, (err, db) => {
        if (err) {
            res.end('Could not connect to database');
            return console.log(chalk.red('Database error.'));
        }
        db.collection('urls').findOne({
            'shortUrl': req.params.id
        }, (err, doc) => {
            console.log(doc);
            if (doc) {
                res.redirect(301, doc.longUrl);
            } else {
                res.end('Does not exist');
            }
        });
    });
});

app.get('/', (req, res) => {
    MongoClient.connect(dbAddress, (err, db) => {
        if (err) {
            return console.log('Could not connect to database!');
        }
        db.collection('urls').find().sort({
            'timestamp': -1
        }).limit(5).toArray().then((docs) => {
            console.log(docs);
            res.render('index.hbs', {
                'urls': docs
            });
        });
    });
});

app.listen(port, () => {
    console.log(chalk.yellow(`Listening on port: ${port}`));
});

function getUniqueHash(orginalUrl) {
    return new Promise((resolve, reject) => {
        // add unix timestamp to string
        const seededString = moment().format('x') + orginalUrl;

        // FNV then Base62
        const hash = Base62.encode(fnv.hash(seededString).dec());

        // check to see if hash exists
        MongoClient.connect(dbAddress, (err, db) => {
            if (err) {
                return reject(err);
            }
            // if the hash is not found in the db it is unique, resolve with
            // the hash. If it is found then call this function recursively.
            db.collection('urls').find({
                'shortUrl': hash
            }).count().then((count) => {
                if (count === 0) {
                    resolve(hash);
                } else {
                    getUniqueHash(orginalUrl);
                }
            });
        });
    });
}
