const { updateCombineShop } = require('./combineShop')
const { updateCommonShop } = require('./commonShop')
const { getLogs } = require('./order_operation_log')
const { updateInventory } = require('./inventory.js')
const { updatePurchase } = require('./purchase.js')
const { updatePurchasein} = require('./purchasein.js')
const { updatePartner } = require('./partner.js')

module.exports = {
    updatePurchase,
    updateInventory,
    updateLogs: getLogs,
    updateCommonShop,
    updatePurchasein,
    updateCombineShop,
    updatePartner
}