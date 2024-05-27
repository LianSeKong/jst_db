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
let modified_end = '2024-05-27 9:00:00'
let modified_begin = '2024-05-25 09:59:59'
// getLogs(modified_begin, modified_end)

const m = new moment('2024-05-25 09:59:59');

getLogs(m.format(formatStr), m.add(1, 'h').format(formatStr))

// new CronJob('0 0 * * * *', 
//     async function () {
//         // const config = JSON.parse(fs.readFileSync(path.join(__dirname, './utils/jstconfig.json'), 'utf8'))
//         // const m = new moment('2024-05-25 10:32:40');
//         // let modified_end = m.format(formatStr);
//         // m.subtract(1, "hours");
//         // let modified_begin = m.format(formatStr);
//         // if (modified_end > new moment(config.generate).add(21, 'days').format(formatStr)) {
//         //     await refrshToken(modified_end);
//         // }

//         let modified_end = '2024-05-27 9:00:00'
//         let modified_begin = '2024-05-25 9:32:40'
//         // getLogs(modified_begin, modified_end)
//         getCommonShopList(modified_begin, modified_end)
//         // getCombineShopList(modified_begin, modified_end)
//         // getPurchaseList(modified_begin, modified_end)
//     }, // onTick
//     function () {

//     }, // onComplete
//     true, // start
//     'system'
// );
