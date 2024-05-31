const {updatePartner, updateCombineShop, updateCommonShop, updateInventory, updateLogs, updatePurchase, updatePurchasein,} = require('./modules/index.js')
const { refrshToken } = require('./utils/refresh_token')
const moment = require("moment");
const formatStr = "YYYY-MM-DD HH:mm:ss";
const fs = require('fs')
const path = require('path')
const { prisma } = require("./utils/dbConnect");
const { CronJob } = require('cron');
new CronJob('0 0/5 * * * *', 
    async function () {
        const config = JSON.parse(fs.readFileSync(path.join(__dirname, './utils/jstconfig.json'), 'utf8'))

        const m = new moment();
        let modified_end = m.format(formatStr);
        m.subtract(5, "m");
        let modified_begin = m.format(formatStr);
        if (modified_end > new moment(config.generate).add(21, 'days').format(formatStr)) {
            await refrshToken(modified_end);
        }
       await updatePartner()

       await Promise.all([
            updateCombineShop(modified_begin, modified_end),
            updateCommonShop(modified_begin, modified_end),
            updateInventory(modified_begin, modified_end),
            updateLogs(modified_begin, modified_end),
            updatePurchase(modified_begin, modified_end),
            updatePurchasein(modified_begin, modified_end)])
            
       prisma.$disconnect() 
    }, // onTick
    function () {

    }, // onComplete
    true, // start
    'system'
);
