const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
const fs = require("fs");
const path = require("path");
const { formatResponseError } = require("../utils/errors.js");
const { foramtRequestDBInsert } = require("../utils/tools");
const combine_itemsku_flds = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./combine_itemsku_flds.json"), "utf8")
);

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
    const URL = "open/combine/sku/query";
    let list = [];
    let hasNext = true;
    let isOper = false;

    // onTicK
    async function onTicK() {
      // 接口调用阻塞中
      if (isOper) return; // 正在数据库操作则直接进行下一次轮询

      // 数据量达到阈值则进行数据库操作，阻塞接口调用
      if (list.length > 2000) {
        isOper = true;
        list = await operateDB(list);
        isOper = false;
        return;
      }

      // 数据获取完毕
      if (hasNext === false) {
        this.stop();
        return;
      }

      try {
        //发送请求，获取数据
        const response = await CallJSTAPI(URL, biz);
        // 请求出错, 抛出错误
        if (response.code !== 0) {
          reject(formatResponseError("组合装商品资料", biz, response.msg));
          return;
        }

        const { data } = response;
        const { datas = [], has_next = false } = data;

        if (datas instanceof Array) {
          list.push(...datas);
        }

        // 下次循环
        hasNext = has_next;
        biz.page_index++;
      } catch (error) {
        reject("调用组合装商品资料接口时出现错误： ", error.message);
      }
    }

    // onComplete
    async function onComplete() {
      try {
        list = await operateDB(list);
        resolve("ok");
      } catch (error) {
        reject("组合装数据库操作错误\n", error.message);
      }
    }

    async function operateDB(list) {
      // 格式化子表数据
      const itemList = list
        .flatMap((item) => item.items)
        .filter((item) => item instanceof Object);

      // 格式化主表数据
      const data = list.map((item) => {
        delete item.items;
        return item;
      });

      try {
        // 数据库操作
        await prisma.combine_shops.createMany({
          data,
        });
        await prisma.combine_shops_item.createMany({
          data: itemList,
        });
        foramtRequestDBInsert(biz, "组合装商品资料", list.length);
        return [];
      } catch (error) {
        throw new Error(error.message);
      }
    }
    new CronJob(`0/5 * * * * *`, onTicK, onComplete, true, "system");
  });
}
module.exports = { updateCombineShop };
