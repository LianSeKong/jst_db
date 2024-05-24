const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");




async function insertIntoDatabaseOfPurchase(list) {
  const data = list.map((item) => {
    delete item.items;
    switch (item.status) {
      case "Creating":
        item.status = "草拟";
        break;
      case "WaitConfirm":
        item.status = "待审核";
        break;
      case "Confirmed":
        item.status = "已确认";
        break;
      case "Finished":
        item.status = "完成";
        break;
      case "Cancelled":
        item.status = "作废";
        break;
    }
    switch (item.receive_status) {
      case "Timeout":
        item.status = "预计收货超时";
        break;
      case "Received":
        item.status = "全部入库";
        break;
      case "Part_Received":
        item.status = "部分入库";
        break;
      case "Not_Received":
        item.status = "未入库";
        break;
    }
    return item;
  });
  await prisma.purchase.createMany({
    data,
  });
  return [];
}

async function insertIntoDatabaseOfPurchaseItem(data) {
  await prisma.purchase_item.createMany({
     data: data.filter(item => item instanceof Object)  
  });
  return [];
}

// open/combine/sku/query
function getPurchaseList(modified_begin, modified_end) {
  const biz = {
    page_index: 1,
    page_size: 50,
    modified_begin: modified_begin,
    modified_end: modified_end,
    po_ids: [],
    so_ids: [],
  };

  let isExecuted = false;
  let list = [];
  let itemList = [];
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
        if (!isExecuted) {
          try {
            isExecuted = true;
            if (list.length > 2000 || itemList.length > 2000) {
              if (list.length > 2000) {
                list = await insertIntoDatabaseOfPurchase(item);
              }
              if (itemList.length > 2000) {
                itemList = await insertIntoDatabaseOfPurchaseItem(itemList);
              }
              isExecuted = false
            } else {
              const { data } = await CallJSTAPI("open/purchase/query", biz);
              list.push(...data.datas);
              itemList.push(...(data.datas.flatMap((item) => item.items)))
              has_next = data.has_next;
              biz.page_index = biz.page_index + 1;
              isExecuted = false
            }
          } catch (error) {
            console.log("获取采购单数据失败：", error, biz);
            restart();
          }
        }
      } else {
        this.stop();
      }
    },
    async function () {
      itemList = await insertIntoDatabaseOfPurchaseItem(itemList)
      list = await insertIntoDatabaseOfPurchase(list)
      await prisma.$disconnect();
    },
    true,
    "system" // timeZone
  );
}
module.exports = { getPurchaseList };
