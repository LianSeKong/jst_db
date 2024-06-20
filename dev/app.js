const {updatePartner, updateCombineShop, updateCommonShop, updateInventory, updateLogs, updatePurchase, updatePurchasein,} = require('./modules/index.js')
const { refrshToken } = require('./utils/refresh_token')
const moment = require("moment");
const formatStr = "YYYY-MM-DD HH:mm:ss";
const fs = require('fs')
const path = require('path')
const { prisma } = require("./utils/dbConnect");
let modified_begin = '2024-06-19 17:05:00';
let modified_end = '2024-06-19 17:15:00';
async function helper() {
    await updatePartner()
    await Promise.all([
        updateCombineShop(modified_begin, modified_end),
        updateCommonShop(modified_begin, modified_end),
        updateInventory(modified_begin, modified_end),
        // updateLogs(modified_begin, modified_end),
        updatePurchase(modified_begin, modified_end),
        updatePurchasein(modified_begin, modified_end)])
}

helper()