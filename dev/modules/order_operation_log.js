const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
// 订单操作日志URL
const URL = "open/order/action/query";
const { foramtRequestDBInsert } = require("../utils/tools");

function getLogs(modified_begin, modified_end) {


  return new Promise((resolve, reject) => {
    // 参数
    const biz = {
      page_index: 1,
      page_size: 500,
      modified_begin,
      modified_end,
    };
    let list = [];
    let has_next = true;
    async function onTick() {
      if (has_next) {
        const response = await CallJSTAPI(URL, biz);
        if (response.code === 0) {
          const data = response.data;
          const { datas } = data;
          if (datas instanceof Array) {
            list.push(...datas);
          }
          has_next = data.has_next;
          biz.page_index++;
        } else {
          has_next = false;
          throw new Error(
            "订单操作日志： " + JSON.stringify(Object.assign(biz, response))
          );
        }
      } else {
        this.stop();
      }
    }
  
    async function onComplete() {
      await db_oper(list);
      foramtRequestDBInsert(biz, "订单操作日志", list.length);
      resolve("ok");
    }
    // 数据库操作
    const db_oper = async (list) => {
      for (const log of list) {
        await prisma.order_operation_log.upsert({
          where: {
            oa_id: log.oa_id,
          },
          update: log,
          create: log,
        });
      }
      return "ok"
    };

    new CronJob(`0/5 * * * * *`, onTick, onComplete, true, "system");
  });
}
module.exports = { getLogs };
