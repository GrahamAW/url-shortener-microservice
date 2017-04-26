'use strict';

require('dotenv').config();
const express = require('express');
const chalk = require('chalk');

// listen on port set in env in deveopment or just port 80 if no env files exist
const port = process.env.PORT || 80;

const app = express();

// listen to get requests on any url
app.get('*', (req, res) => {

  res.end('Hello.');
});

app.listen(port, () => {
  console.log(chalk.yellow(`Listening on port: ${port}`));
});
