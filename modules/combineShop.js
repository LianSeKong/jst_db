const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
const moment = require("moment");
const formatStr = "YYYY-MM-DD HH:mm:ss";
// open/combine/sku/query
function getCombineShopList() {
  const biz = {
    page_index: 1,
    page_size: 50,
    modified_begin: "",
    modified_end: "",
  };
  const m = new moment();
  biz.modified_end = m.format(formatStr);
  m.subtract(1, "hours");
  biz.modified_begin = m.format(formatStr);
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
            const { data } = await CallJSTAPI("open/combine/sku/query", biz)
            list.push(...data.datas);  
            has_next = data.has_next;
            biz.page_index = biz.page_index + 1;
          } catch (error) {
            console.log("获取组合装商品数据失败：", err, biz);
            restart()
          }
        } else {
          this.stop();
        }
      },
      async function () {
        const itemList = list.flatMap((item) => item.items);
        const data = list.map((item) => {
            delete item.items
            return item
        })
        await prisma.combine_shops_item.createMany({
          data: itemList,
        });

        await prisma.combine_shops.createMany({
          data,
        });
        console.log("组合装商品数据更新完成");
        list = [];
        await prisma.$disconnect();
      },
      true,
      "system" // timeZone
    );
}
module.exports = { getCombineShopList };
