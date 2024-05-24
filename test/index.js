const { getCombineShopList } = require('../modules/combineShop')
const { getCommonShopList } = require('../modules/commonShop')
const { getLogs } = require('../modules/order_operation_log')
const { getPurchaseList } = require('../modules/purchase.js')
const { refrshToken } = require('../utils/refresh_token')
const moment = require("moment");
const formatStr = "YYYY-MM-DD HH:mm:ss";
const fs = require('fs')
const path = require('path')


const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../utils/jstconfig.json'), 'utf8'))
const m = new moment();
let modified_end = m.format(formatStr);
console.log(modified_end , new moment(config.generate).add(21, 'days').format(formatStr));


