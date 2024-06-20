const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");
const { foramtRequestError, foramtRequestDBInsert } = require("../utils/tools");



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
      `0/5 * * * * *`,
      async function () {
        if (has_next) {
          const response = await CallJSTAPI("open/purchase/query", biz);
          if (response.code === 0) {
            const { has_next = false, datas } = response.data;
            if (datas instanceof Array && datas.length > 0) {
              const data = formatData(datas);
              itemList.push(...data.itemList);
              list.push(...data.list);
            }
            biz.page_index += 1;
            hasNext = has_next;
          } else {
            hasNext = false;
            throw new Error(
              foramtRequestError(biz, "采购单请求错误", response)
            );
          }
        } else {
          this.stop();
        }
      },
      async function () {
        await prisma.purchase.createMany({ data: list });
        await prisma.purchase_item.createMany({ data: itemList});
        foramtRequestDBInsert(biz, "采购单", {
          采购单主表: list.length,
          采购单子表: itemList.length,
        });
        res("ok");
      },
      true,
      "system" // timeZone
    );
  });
}
module.exports = { getPurchaseList };

function formatStatus(status) {
  switch (status) {
    case "Creating":
      status = "草拟";
      break;
    case "WaitConfirm":
      status = "待审核";
      break;
    case "Confirmed":
      status = "已确认";
      break;
    case "Finished":
      status = "完成";
      break;
    case "Cancelled":
      status = "作废";
      break;
  }
  return status;
}

function formatReceiveStatus(receive_status) {
  switch (receive_status) {
    case "Timeout":
      receive_status = "预计收货超时";
      break;
    case "Received":
      receive_status = "全部入库";
      break;
    case "Part_Received":
      receive_status = "部分入库";
      break;
    case "Not_Received":
      receive_status = "未入库";
      break;
  }
  return receive_status;
}

function formatData(datas) {
  const itemList = datas
    .flatMap((item) => item.items)
    .filter((item) => item instanceof Object);

  const list = datas.map((item) => {
    delete item.items;
    item.status = formatStatus(item.status);
    item.receive_status = formatReceiveStatus(item.receive_status);
    return item;
  });
  return { itemList, list };
}
