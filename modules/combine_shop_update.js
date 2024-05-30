const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
const fs = require('fs')
const path = require('path')
const combine_itemsku_flds = JSON.parse(fs.readFileSync(path.join(__dirname, './combine_itemsku_flds.json'), 'utf8'))


// open/combine/sku/query
function getCombineShopList(modified_begin, modified_end) {
  const biz = {
    page_index: 1,
    page_size: 50,
    modified_begin,
    modified_end,
    combine_itemsku_flds
  };
  let list = [];
  let hasNext = true;
  new CronJob(
      `0/5 * * * * *`,
      async function () {
        if (hasNext) {
            const result = await CallJSTAPI("open/combine/sku/query", biz)
            if (result.code === 0) {
                const { datas=[], has_next } = result.data;
                list.push(...datas);
                hasNext = has_next;
                biz.page_index++;
            } else {
                console.log('combine shop error, result: ',result, ' biz: ', biz);
                this.stop();
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
        console.log("组合装商品数据更新完成", biz);
        list = [];
        await prisma.$disconnect();
      },
      true,
      "system" // timeZone
    );
}
module.exports = { getCombineShopList };
