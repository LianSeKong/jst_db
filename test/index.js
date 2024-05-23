const { getCombineShopList } = require('../modules/combineShop')
const { getCommonShopList } = require('../modules/commonShop')
const { getLogs } = require('../modules/order_operation_log')
const { getPurchaseList } = require('../modules/purchase.js')
const { refrshToken } = require('../utils/refresh_token')
const moment = require("moment");
const formatStr = "YYYY-MM-DD HH:mm:ss";
const fs = require('fs')
const path = require('path')
const { CronJob } = require('cron');

const m = new moment();
let modified_end = m.format(formatStr);
m.subtract(1, "days");
let modified_begin = m.format(formatStr);
getPurchaseList(modified_begin, modified_end)
// new CronJob('0 0/2 * * * * ', 
//     async function () {
//         const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../utils/jstconfig.json'), 'utf8'))
//         if (Math.ceil(config.expires_in / 60 / 60 / 24) < 10) {
//             await refrshToken();
//         }
//         const m = new moment();
//         let modified_end = m.format(formatStr);
//         m.subtract(1, "days");
//         let modified_begin = m.format(formatStr);
//         getPurchaseList(modified_begin, modified_end)
//     }, // onTick
//     function () {

//     }, // onComplete
//     true, // start
//     'system'
// );
