const { updateCombineShop } = require('./combineShop.js')
const moment = require('moment')
const formatStr = "YYYY-MM-DD HH:mm:ss";
const { sendDingDing } = require('../utils/rebot/index')



async function helper() {
    let modified_end = '2024-06-20 15:00:00';
    let modified_begin = '2024-06-13 15:00:00';
    while (true) {
        try {
            await updateCombineShop(modified_begin, modified_end)
            modified_end = modified_begin
            modified_begin = new moment(modified_begin).subtract(7, 'd').format(formatStr)
        } catch (error) {
            sendDingDing(error)
        }
    }
}

helper()