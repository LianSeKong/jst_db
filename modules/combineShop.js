const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");

// open/combine/sku/query
function getCombineShopList(modified_begin, modified_end) {
  const biz = {
    page_index: 1,
    page_size: 50,
    modified_begin,
    modified_end,
    combine_itemsku_flds:  [
      "sku_id",
      "labels",
      "sku_code",
      "i_id",
      "name",
      "other_price_1",
      "other_price_2",
      "other_price_3",
      "other_price_4",
      "other_price_5",
      "other_1",
      "other_2",
      "other_3",
      "other_4",
      "other_5",
      "other_6",
      "other_7",
      "other_8",
      "other_9",
      "other_10",
      "l",
      "w",
      "h",
      "volume",
      "item_type",
      "remark",
      "sku_qty",
      "short_name",
      "vc_name",
      "pic",
      "properties_value",
      "sale_price",
      "weight",
      "modified",
      "created",
      "enty_sku_id",
      "brand",
      "cost_price",
      "enabled"
  ]
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
            const { data } = await CallJSTAPI("open/combine/sku/query", biz)
            list.push(...data.datas);  
            has_next = data.has_next;
            biz.page_index = biz.page_index + 1;
          } catch (error) {
            console.log("获取组合装商品数据失败：", error, biz);
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
