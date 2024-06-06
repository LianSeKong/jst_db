const {updatePartner, updateCombineShop, updateCommonShop, updateInventory, updateLogs, updatePurchase, updatePurchasein,} = require('./modules/index.js')




async function helper () {

    let modified_end = '2024-06-04 15:00:00';
    let modified_begin = '2024-06-03 00:00:00';
    updateCombineShop(modified_begin, modified_end)
}
helper()

