const fs = require('fs')
const path = require('path')
const moment = require('moment')

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../utils/jstconfig.json'), 'utf8'))
console.log(Math.ceil(config.expires_in / 60 / 60 / 24));

console.log(config);

const p = new moment().format("YYYY-MM-DD HH:mm:ss")

const p2 = new moment(config.generate).add(20, 'days').format("YYYY-MM-DD HH:mm:ss")

console.log(p > p2 );