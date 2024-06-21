const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
const fs = require("fs");
const path = require("path");
const { foramtRequestError } = require("../utils/tools");
const { createLog  } = require('../utils/log')
const combine_itemsku_flds = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./combine_itemsku_flds.json"), "utf8")
);
const URL = "open/combine/sku/query"
// open/combine/sku/query
function updateCombineShop(modified_begin, modified_end) {
  return new Promise((resolve, reject) => {
    const biz = {
      page_index: 1,
      page_size: 50,
      modified_begin,
      modified_end,
      combine_itemsku_flds,
    };

    const circle = {
      has_next: true,
      updateList: [],
    };

    async function onTick() {
      if (circle.has_next === false) {
        this.stop();
      }
      try {
        const response = await CallJSTAPI(URL, biz);
        if (response.code !== 0) {
          circle.has_next = false;
          createLog(biz.modified_begin, biz.modified_end, null, "组合装资料", response.msg, false)  
          reject(foramtRequestError(biz, "组合装资料", response.msg));
        }

        const { data = {} } = response;
        const { datas = [], has_next = false } = data;
        if (datas instanceof Array) {
          circle.updateList.push(...datas);
      }
        biz.page_index++;
        circle.has_next = has_next;
      } catch (error) {
        createLog(biz.modified_begin, biz.modified_end, null, "组合装资料", error, false)  
        reject("组合装商品资料：" + error);
      }
    }

    async function onComplete() {
      const itemList = circle.updateList
        .flatMap((item) => item.items)
        .filter((item) => item instanceof Object);

      const data = circle.updateList.map((item) => {
        delete item.items;
        return item;
      });

      try {
        const itemResult = await prisma.combine_shops_item.createMany({
          data: itemList,
        });

        await prisma.combine_shops.createMany({
          data,
        });
        createLog(biz.modified_begin, biz.modified_end, itemResult.count, "组合装资料", URL, true)  
        resolve('ok')
      } catch (error) {
        createLog(biz.modified_begin, biz.modified_end, null, "组合装资料", error.message, false)  
        reject(error.message);
      }
    }

    new CronJob(`0/5 * * * * *`, onTick, onComplete, true, "system");
  });
}
module.exports = { updateCombineShop };
