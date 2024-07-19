const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
const { createLog  } = require('../utils/log')
const { foramtRequestError } = require("../utils/tools");
const URL = 'open/purchase/query'

function foramtStatus(list) {
  return list.map((item) => {
    delete item.items;
    delete item.inQty;
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
}

// open/combine/sku/query
function updatePurchase(modified_begin, modified_end) {
  return new Promise((resolve, reject) => {
    const biz = {
      page_index: 1,
      page_size: 50,
      modified_begin: modified_begin,
      modified_end: modified_end,
      po_ids: [],
      so_ids: [],
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
        const response= await CallJSTAPI(URL, biz);
        if (response.code !== 0) {
          circle.has_next = false;
          console.log(response.msg);
          createLog(biz.modified_begin, biz.modified_end, null, "采购单", response.msg, false)  
          reject(foramtRequestError(biz, "采购单", response.msg));
        }

        const { data = {} } = response;
        const { datas = [], has_next = false } = data;
        if (datas instanceof Array) {
          circle.updateList.push(...datas);
      }
        biz.page_index++;
        circle.has_next = has_next;
      } catch (error) {
        console.log(error);
        createLog(biz.modified_begin, biz.modified_end, null, "采购单", error, false)  
        reject(foramtRequestError(biz, "采购单", error));
      }
    }
    

    
    async function onComplete() {
      const itemList = circle.updateList
        .flatMap((item) => item.items)
        .filter((item) => item instanceof Object);

      const updateList = foramtStatus(circle.updateList);

      try {
        await prisma.purchase.createMany({
          data: updateList
        });
        await prisma.purchase_item.createMany({
          data: itemList
        })
        createLog(biz.modified_begin, biz.modified_end, itemList.length, "采购单", URL, true)
        resolve('ok')
      } catch (error) {
        console.log(error);
        createLog(biz.modified_begin, biz.modified_end, null, "采购单", error.message, false)
        reject(error.message);
      }
    }

    new CronJob(`0/5 * * * * *`, onTick, onComplete, true, "system");


  })
}
module.exports = { updatePurchase };
