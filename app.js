const { getCombineShopList } = require('./modules/combineShop')
const { getCommonShopList } = require('./modules/commonShop')
const { getLogs } = require('./modules/order_operation_log')
const { refrshToken } = require('./utils/refresh_token')
const moment = require("moment");
const formatStr = "YYYY-MM-DD HH:mm:ss";
const fs = require('fs')
const path = require('path')
const { CronJob } = require('cron');
new CronJob('0 1 * * * *', async function () {
        const config = JSON.parse(fs.readFileSync(path.join(__dirname, './utils/jstconfig.json'), 'utf8'))
        if (Math.ceil(config.expires_in / 60 / 60 / 24) < 10) {
            await refrshToken();
        }
        const m = new moment();
        let modified_end = m.format(formatStr);
        m.subtract(2, "days");
        let modified_begin = m.format(formatStr);
        getLogs(modified_begin, modified_end)
        getCommonShopList(modified_begin, modified_end)
        getCombineShopList(modified_begin, modified_end)
    }, // onTick
    function () {

    }, // onComplete
    true, // start
    'system'
);
