const moment = require("moment");
const formatStr = "YYYY-MM-DD HH:mm:ss";
const {getInventoryList} = require('./modules/inventory.js')
const m = new moment();
let modified_end = m.format(formatStr);
m.subtract(5, "m");
let modified_begin = m.format(formatStr);

getInventoryList(modified_begin, modified_end);