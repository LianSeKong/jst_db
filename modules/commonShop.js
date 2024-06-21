const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
const { foramtRequestError } = require("../utils/tools");
const { createLog  } = require('../utils/log');
const URL = "open/sku/query"
function updateCommonShop(modified_begin, modified_end) {
  return new Promise((resolve, reject) => {



    const biz = {
      page_index: 1,
      page_size: 50,
      modified_begin,
      modified_end,
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


          createLog(biz.modified_begin, biz.modified_end, null, "普通商品资料", response.msg, false)
          reject(foramtRequestError(biz, "普通商品资料", response.msg));
        }

        const { data = {} } = response;
        const { datas = [], has_next = false } = data;
        if (datas instanceof Array) {
          circle.updateList.push(...datas);
      }
        biz.page_index++;
        circle.has_next = has_next;
      } catch (error) {
        createLog(biz.modified_begin, biz.modified_end, null, "普通商品资料", error, false)  
        reject("普通商品资料：" + error);
      }
    }

    async function onComplete() {
      try {
        const result = await prisma.common_shops.createMany({
          data: circle.updateList,
        });
        createLog(biz.modified_begin, biz.modified_end, result.count, "普通商品资料", URL, true)  
        resolve("ok");
      } catch (error) {
        createLog(biz.modified_begin, biz.modified_end, null, "普通商品资料", error.message, true)  
        reject(error.message);
      }
    }

    new CronJob(`0/5 * * * * *`, onTick, onComplete, true, "system");
  });
}
module.exports = { updateCommonShop };
