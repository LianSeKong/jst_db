"use strict"
const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
// 订单操作日志URL
const { CronJob } = require("cron");
const URL = "open/order/action/query";
const { createLog  } = require('../utils/log')
const { foramtRequestError } = require("../utils/tools");
function getLogs(modified_begin, modified_end) {
  return new Promise((resolve, reject) => {
    // 参数
    const biz = {
      page_index: 1,
      page_size: 500,
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
          createLog(biz.modified_begin, biz.modified_end, null, "订单操作日志", response.msg.slice(0, 20), false)  
          reject(foramtRequestError(biz, "订单操作日志", response.msg));
        }

        const { data = {} } = response;
        const { datas = [], has_next = false } = data;
        if (datas instanceof Array) {
          circle.updateList.push(...datas);
      }
        biz.page_index++;
        circle.has_next = has_next;
      } catch (error) {
        createLog(biz.modified_begin, biz.modified_end, null, "订单操作日志", error.slice(0, 20), false)  
        reject(foramtRequestError(biz, "订单操作日志", error));
      }
    }

    async function onComplete() {
      try {
        for (const log of circle.updateList) {
          await prisma.order_operation_log.upsert({
            where: {
              oa_id: log.oa_id,
            },
            update: log,
            create: log,
          });
        }
        createLog(biz.modified_begin, biz.modified_end, circle.updateList.length, "订单操作日志", "", true)
        resolve("ok");
      } catch (error) {
        createLog(biz.modified_begin, biz.modified_end, null, "订单操作日志", error.message.slice(0, 20), true)
        reject(error.message);
      }
    }
    new CronJob(`0/5 * * * * *`, onTick, onComplete, true, "system");
  });
}

module.exports = { getLogs };
