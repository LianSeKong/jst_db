const { getCombineShopList } = require('./combineShop')
const { getCommonShopList } = require('./commonShop')
const { getLogs } = require('./order_operation_log')
const { getInventoryList } = require('./inventory.js')
const { getPurchaseList } = require('./purchase.js')
const { getPurchaseinList} = require('./purchasein.js')
const { updatePartner } = require('./partner.js')

module.exports = {
    updateCombineShop: getCombineShopList,
    updateCommonShop: getCommonShopList,
    updateLogs: getLogs,
    updateInventory: getInventoryList,
    updatePurchase: getPurchaseList,
    updatePurchasein: getPurchaseinList,
    updatePartner
}