const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require("cron");

// open/combine/sku/query
function getPurchaseList(modified_begin, modified_end) {
  const biz = {
    page_index: 1,
    page_size: 50,
    modified_begin: modified_begin.slice(0, 10),
    modified_end:  modified_end.slice(0, 10),
    "po_ids": [],
    "so_ids": [],
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
            const { data } = await CallJSTAPI("open/purchase/query", biz)
            list.push(...data.datas);  
            has_next = data.has_next;
            biz.page_index = biz.page_index + 1;
          } catch (error) {
            console.log("获取采购单数据失败：", error, biz);
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
            switch(item.status) {
                case 'Creating':
                    item.status = '草拟'
                    break
                case 'WaitConfirm':
                    item.status = '待审核'
                    break
                case 'Confirmed':
                    item.status = '已确认'
                    break
                case 'Finished':
                    item.status = '完成'
                    break
                case 'Cancelled':
                        item.status = '作废'
                        break                    
            }
            switch(item.receive_status) {
                case 'Timeout':
                    item.status = '预计收货超时'
                    break
                case 'Received':
                    item.status = '全部入库'
                    break
                case 'Part_Received':
                    item.status = '部分入库'
                    break
                case 'Not_Received':
                    item.status = '未入库'
                    break                 
            }            
            return item
        })
        console.log(itemList);
        await prisma.purchase_item.createMany({
          data: itemList,
        });

        await prisma.purchase.createMany({
          data,
        });
        console.log("采购单数据更新完成");
        list = [];
        await prisma.$disconnect();
      },
      true,
      "system" // timeZone
    );
}
module.exports = { getPurchaseList };
