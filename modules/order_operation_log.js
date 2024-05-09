const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
// 订单操作日志URL
const { CronJob } = require('cron');
const URL = 'open/order/action/query';




function getLogs(modified_begin, modified_end) {
    // 参数
    const biz = {
        page_index: 1,
        page_size: 50,
        modified_begin,
        modified_end,
    };
    let list = [];
    let has_next = true;
    // 重新开始
    function restart() {
        biz.page_index = 1;
        list = [];
        has_next = true;
    }
    new CronJob(
        `0/5 * * * * *`,
        async function () {
          if (has_next) {
            try {
              const { data } = await CallJSTAPI(URL, biz);
              list.push(...data.datas);
              has_next = data.has_next;
              biz.page_index = biz.page_index + 1;
            } catch (error) {
              console.log(error);
              restart();
            } 
          } else {
            this.stop();
          }
        },
        async function () {
          const result = await prisma.order_operation_log.createMany({ data: list });
          console.log("订单操作日志入库完成！", result);
          await prisma.$disconnect();
        },
        true,
        "system"
        );

}

module.exports = { getLogs };