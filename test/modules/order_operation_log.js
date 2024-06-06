const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
// 订单操作日志URL
const { CronJob } = require('cron');
const URL = 'open/order/action/query';
const { foramtRequestError, foramtRequestDBInsert } = require('../utils/tools')



function getLogs(modified_begin, modified_end) {
  return new Promise((res, rej) => {
     // 参数
  const biz = {
    page_index: 1,
    page_size: 50,
    modified_begin,
    modified_end,
  };
  let list = [];
  let has_next = true;


  new CronJob(
    `0/7 * * * * *`,
    async function () {
      if (has_next) {
        try {
          const response = await CallJSTAPI(URL, biz);
          if (response.code === 0) {
            const data = response.data
            if (data.datas instanceof Array) {
              list.push(...data.datas);
            }
            has_next = data.has_next;
            biz.page_index++;
          } else {
            has_next = false;
            foramtRequestError(biz, '订单操作日志请求错误', response)
          }
        } catch (error) {
          foramtRequestError(biz, '订单操作日志请求网络错误', error)
          has_next = false
        }
      } else {
        this.stop();
      }
    },
    async function () {
      const result = await prisma.order_operation_log.createMany({ data: list });
      foramtRequestDBInsert(biz, '订单操作日志', result.count)
      res('ok')
    },
    true,
    "system"
  );
  })

}

module.exports = { getLogs };