'use strict';

require('dotenv').config();
const express = require('express');
const chalk = require('chalk');

// listen on port set in env in deveopment or just port 80 if no env files exist
const port = process.env.PORT || 80;

const app = express();

// Listen for
app.get('/new/*', (req, res) => {

  res.send(req.params[0]);

});

app.get('/:id', (req, res) => {

  res.send(req.params);
});

app.get('/', (req, res) => {

  res.end('TODO: Home Page');
});

app.listen(port, () => {
  console.log(chalk.yellow(`Listening on port: ${port}`));
});
