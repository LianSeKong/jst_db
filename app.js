const {
  updatePartner,
  updateCombineShop,
  updateCommonShop,
  updateInventory,
  updateLogs,
  updatePurchase,
  updatePurchasein,
} = require("./modules/index.js");
const { CallRefreshToken } = require("./utils/CallJSTAPI.js");
const moment = require("moment");
const formatStr = "YYYY-MM-DD HH:mm:ss";
const { getJSTConfig } = require('./utils/tools.js')
const axios = require("axios")
const { prisma } = require("./utils/dbConnect");
const { CronJob } = require("cron");
const { sendDingDing } = require("./utils/dingding.js")
async function test() {
  const config = getJSTConfig()

  const m = new moment();
  let modified_end = '2024-07-19 09:00:00' 
  let modified_begin = '2024-07-18 14:15:00' 

  try {
    if (
      modified_end >
      new moment(config.generate).add(21, "days").format(formatStr)
    ) {
      await CallRefreshToken();
    }
    await updatePartner();
     await Promise.all([
      updateCombineShop(modified_begin, modified_end),
      updateCommonShop(modified_begin, modified_end),
      updateInventory(modified_begin, modified_end),
      // updateLogs(modified_begin, modified_end),
      updatePurchase(modified_begin, modified_end),
      updatePurchasein(modified_begin, modified_end),
    ]);
  } catch (error) {
    sendDingDing(error)
  }
  prisma.$disconnect();
}

 test()

