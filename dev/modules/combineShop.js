const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
const fs = require("fs");
const path = require("path");
const { foramtRequestError, foramtRequestDBInsert } = require("../utils/tools");
const combine_itemsku_flds = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./combine_itemsku_flds.json"), "utf8")
);

// open/combine/sku/query
function getCombineShopList(modified_begin, modified_end) {
  return new Promise((res, rej) => {
    const biz = {
      page_index: 1,
      page_size: 50,
      modified_begin,
      modified_end,
      combine_itemsku_flds,
    };
    const URL = "open/combine/sku/query";
    let list = [];
    let has_next = true;

    // onTicK
    async function onTicK() {
      // 数据获取完毕
      if (has_next === false) {
        this.stop();
        return;
      }

      //发送请求，获取数据
      const response = await CallJSTAPI(URL, biz);

      // 请求出错, 抛出错误
      if (response.issuccess !== true)
        throw new Error(foramtRequestError(biz, "组合装请求错误", response));

      const { data } = response;
      const { datas = [] } = data;

      list.push(...datas);

      // 下次循环
      has_next = data.has_next;
      biz.page_index++;
    }

    // onComplete
    async function onComplete() {
      // 格式化子表数据
      const itemList = list
        .flatMap((item) => item.items)
        .filter((item) => item instanceof Object);

      // 格式化主表数据
      const data = list.map((item) => {
        delete item.items;
        return item;
      });

      // 数据库操作
      await prisma.combine_shops_item.createMany({
        data: itemList,
      });

      // 数据库操作
      await prisma.combine_shops.createMany({
        data,
      });

      foramtRequestDBInsert(biz, "组合装商品资料", {
        组合装子表: itemResult.count,
        组合装总表: dataResult.count,
      });

      res("ok");
    }

    new CronJob(`0/5 * * * * *`, onTicK, onComplete, true, "system");
  });
}
module.exports = { getCombineShopList };
