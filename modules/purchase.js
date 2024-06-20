const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
const { foramtRequestError, foramtRequestDBInsert } = require('../utils/tools')
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
        item.receive_status = "预计收货超时";
        break;
      case "Received":
        item.receive_status = "全部入库";
        break;
      case "Part_Received":
        item.receive_status = "部分入库";
        break;
      case "Not_Received":
        item.receive_status = "未入库";
        break;
    }
    return item;
  });
  return await prisma.purchase.createMany({
    data,
  });

}

async function insertIntoDatabaseOfPurchaseItem(data) {
  return await prisma.purchase_item.createMany({
     data
  });
}

// open/combine/sku/query
function getPurchaseList(modified_begin, modified_end) {
  return new Promise((res, rej) => {
    const biz = {
      page_index: 1,
      page_size: 50,
      modified_begin: modified_begin,
      modified_end: modified_end,
      po_ids: [],
      so_ids: [],
    };
    let list = [];
    let itemList = [];
    let has_next = true;
  
    new CronJob(
      `0/7 * * * * *`,
      async function () {
        if (has_next) {
          try {
            const response= await CallJSTAPI("open/purchase/query", biz);
            if (response.code === 0) {
              const data = response.data 
              if (data.datas instanceof Array) {
                list.push(...data.datas);
                itemList.push(...(data.datas.flatMap((item) => item.items)).filter(item => item instanceof Object) )
              }
              has_next = data.has_next;
              biz.page_index++;
            } else {
              has_next = false;
              rej(foramtRequestError(biz, '采购单请求错误', response))
            }
          } catch (error) {
            has_next = false;
            rej(foramtRequestError(biz, '采购单请求网络错误', error))
          }
        } else {
          this.stop();
        }
      },
      async function () {
        try {
          let purchase_item_info = await insertIntoDatabaseOfPurchaseItem(itemList)
          let purchase_info = await insertIntoDatabaseOfPurchase(list)
          foramtRequestDBInsert(biz, '采购单', { 
              '采购单主表': purchase_info.count,
              '采购单子表': purchase_item_info.count  
          })
          res('ok')
        } catch (error) {
          rej( foramtRequestDBInsert(biz, '采购单', error.message))
        }
      },
      true,
      "system" // timeZone
    );
  })
}
module.exports = { getPurchaseList };
