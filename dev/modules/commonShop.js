const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
const { foramtRequestDBInsert } = require("../utils/tools");

function updateCombineShop(modified_begin, modified_end) {
  return new Promise((resolve, reject) => {
    // 请求参数
    const biz = {
      page_index: 1,
      page_size: 50,
      modified_begin,
      modified_end,
    };
    let commonShopList = [];
    let hasNext = true;

    
    new CronJob(`0/5 * * * * *`, onTick, onComplete, true, "system");



    async function onTick() {
      if (has_next) {
        const response = await CallJSTAPI("open/sku/query", biz);
        if (response.code === 0) {
          const data = response.data;
          const { datas } = data;
          if (datas instanceof Array) {
            commonShopList.push(...datas);
          }
          has_next = data.has_next;
          biz.page_index = biz.page_index + 1;
        } else {
          has_next = false;
          throw new Error(
            foramtRequestError(biz, "普通商品资料请求错误", response)
          );
        }
      } else {
        this.stop();
      }
    }

    async function onComplete() {
      const result = await prisma.common_shops.createMany({ data: commonShopList });
      foramtRequestDBInsert(biz, "普通商品资料", result.count);
      resolve("ok");
    }
  });

 
}
module.exports = { updateCombineShop };
