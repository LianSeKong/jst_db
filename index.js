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
const { prisma } = require("./utils/dbConnect");
const { CronJob } = require("cron");
const { sendDingDing } = require("./utils/dingding.js")
const { getJSTConfig } = require('./utils/tools.js')
new CronJob(
  "0 0/5 * * * *",
  async function () {
    const config = getJSTConfig()
    const m = new moment();
    let modified_end = m.format(formatStr);
    m.subtract(5, "m");
    let modified_begin = m.format(formatStr);
    try {
      if (
        modified_end >
        new moment(config.generate).add(20, "days").format(formatStr)
      ) {
        await CallRefreshToken();
      }
      await updatePartner();
      await Promise.all([
        updateCombineShop(modified_begin, modified_end),
        updateCommonShop(modified_begin, modified_end),
        updateInventory(modified_begin, modified_end),
        updateLogs(modified_begin, modified_end),
        updatePurchase(modified_begin, modified_end),
        updatePurchasein(modified_begin, modified_end),
      ]);
    } catch (error) {
      sendDingDing(error)
    }
    prisma.$disconnect();
  }, // onTick
  function () {}, // onComplete
  true, // start
  "system"
);
