const { getCombineShopList } = require('./modules/combineShop')
const { getCommonShopList } = require('./modules/commonShop')
const { refrshToken } = require('./utils/refresh_token')
const fs = require('fs')
const path = require('path')
const { CronJob } = require('cron');
new CronJob('0 1 * * * *', async function () {
        const config = JSON.parse(fs.readFileSync(path.join(__dirname, './utils/jstconfig.json'), 'utf8'))
        if (Math.ceil(config.expires_in / 60 / 60 / 24) < 10) {
            await refrshToken();
        }
        getCommonShopList()
        getCombineShopList()
    }, // onTick
    function () {

    }, // onComplete
    true, // start
    'system'
);
