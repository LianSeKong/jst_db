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


async function test() {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../utils/jstconfig.json'), 'utf8'))
    const m = new moment('2024-05-27 11:00:00');
    let modified_end = m.format(formatStr);
    m.subtract(1, "hours");
    let modified_begin = m.format(formatStr);
    if (modified_end > new moment(config.generate).add(21, 'days').format(formatStr)) {
        await refrshToken(modified_end);
    }
    getLogs(modified_begin, modified_end)
    getCommonShopList(modified_begin, modified_end)
    getCombineShopList(modified_begin, modified_end)
    getPurchaseList(modified_begin, modified_end)
}


test()