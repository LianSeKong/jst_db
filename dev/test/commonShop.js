const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
const { foramtRequestDBInsert } = require("../utils/tools");
const { formatResponseError } = require("../utils/errors.js");
function updateCommonShop(modified_begin, modified_end) {
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
    let isOper = false;

    new CronJob(`0/5 * * * * *`, onTick, onComplete, true, "system");
    async function onTick() {
      // 接口调用阻塞中
      if (isOper) return;  // 正在数据库操作则直接进行下一次轮询
      // 数据量达到阈值则进行数据库操作，阻塞接口调用
      if (commonShopList.length > 20000) {
        isOper = true;
        commonShopList = await operateDB(commonShopList);
        isOper = false;
        return
      }

      // 数据获取完毕
      if (hasNext === false) {
        this.stop();
        return;
      }

      try {
        const response = await CallJSTAPI("open/sku/query", biz);

        // 请求出错, 抛出错误
        if (response.code !== 0) {
          reject(formatResponseError('普通商品资料', biz, response.msg))
          return 
        }

        const { data } = response;
        const { datas = [], has_next = false} = data;

        if (datas instanceof Array) {
          commonShopList.push(...datas);
        }
        // 下次循环
        hasNext = has_next;
        biz.page_index++;

      } catch (error) {
        reject("调用普通商品资料接口时出现错误： ", error.message)
      }
    }

    async function onComplete() {
      try {
        const result = await prisma.common_shops.createMany({ data: commonShopList });
        foramtRequestDBInsert(biz, "普通商品资料", result.count);
        resolve("ok");
      } catch (error) {
        throw new Error(error.message)
      }
    }
  });
}
module.exports = { updateCombineShop };
