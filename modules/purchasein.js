const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
const { createLog  } = require('../utils/log')
const { foramtRequestError } = require("../utils/tools");
const URL = 'open/purchasein/query'



/**
 *
 * @param {string} modified_begin
 * @param {string} modified_end
 */
function updatePurchasein(modified_begin, modified_end) {
  return new Promise((resolve, reject) => {
    const biz = {
      page_index: 1,
      page_size: 50,
      modified_begin,
      modified_end,
      po_ids: [],
      so_ids: [],
      statuss: [],
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
          createLog(biz.modified_begin, biz.modified_end, null, "采购入库", response.msg, false)  
          reject(foramtRequestError(biz, "采购入库", response.msg));
        }
        const { data = {} } = response;
        const { datas = [], has_next = false } = data;
        if (datas instanceof Array) {
            circle.updateList.push(...datas);
        }
        biz.page_index++;
        circle.has_next = has_next;
      } catch (error) {
        createLog(biz.modified_begin, biz.modified_end, null, "采购入库", error, false)  
        reject(foramtRequestError(biz, "采购入库", error));
      }
    }

    async function onComplete() {
      const itemList = circle.updateList
        .flatMap((item) => item.items)
        .filter((item) => item instanceof Object);

      const updateList = circle.updateList.map((item) => {
        delete item.items;
        delete item.ts;
        switch (item.status) {
          case "Archive ":
            item.status = "归档";
            break;
          case "WaitConfirm":
            item.status = "待入库";
            break;
          case "Confirmed":
            item.status = "已入库";
            break;
          case "OuterConfirming ":
            item.status = "外部确认中";
            break;
          case "Cancelled":
            item.status = "取消";
            break;
        }
        switch (item.f_status) {
          case "WaitConfirm":
            item.f_status = "待审核";
            break;
          case "Confirmed":
            item.f_status = "已审核";
            break;
        }
        return item;
      });
      try {
        for (const purchasein of updateList) {
            await prisma.purchasein.upsert({
              where: {
                io_id: purchasein.io_id,
              },
              update: purchasein,
              create: purchasein,
            });
          }
          for (const purchaseinItem of itemList) {
            await prisma.purchasein_item.upsert({
              where: {
                ioi_id: purchaseinItem.ioi_id,
              },
              update: purchaseinItem,
              create: purchaseinItem,
            });
          }
        createLog(biz.modified_begin, biz.modified_end, itemList.length, "采购入库", URL, true);
        resolve('ok')
      } catch (error) {
        createLog(biz.modified_begin, biz.modified_end, null, "采购入库", error.message, false);
        reject("采购入库 " + error.message);
      }
    }
    new CronJob(`0/5 * * * * *`, onTick, onComplete, true, "system");
  });
}

module.exports = { updatePurchasein }
