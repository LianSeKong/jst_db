const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require('cron');
const { foramtRequestError } = require('../utils/tools')
const { createLog  } = require('../utils/log')


// get all partner
async function getAllpartner() {
    return await prisma.partner.findMany()
}

async function updateInventory(modified_begin, modified_end) {
    const partnerList = await getAllpartner()
    for (const partner of partnerList) {
       await parallel(partner.wms_co_id, partner.name,modified_begin, modified_end)
    }
}

function parallel(wms_co_id, name, modified_begin, modified_end) {
  return new Promise((resolve, reject) => {
    let biz = {
        wms_co_id: wms_co_id,
        page_index: 1,
        modified_begin,
        modified_end,
        has_lock_qty: true,
        page_size: 100
    }

    const circle = {
        has_next: true,
        updateList: [],
      };

      async function onTick() {
        if (circle.has_next === false) {
          this.stop();
        }
        try {
          const response = await CallJSTAPI('open/inventory/query', biz);
          if (response.code !== 0) {
            circle.has_next = false;
            createLog(biz.modified_begin, biz.modified_end, null, "商品库存, " + "仓库: " + name, response.msg, false)  
            reject(foramtRequestError(biz, `商品库存请求错误, wms_co_id: ${biz.wms_co_id}`, response.msg));
          }
          
          const { data = {} } = response;
          const { datas = [], has_next = false } = data;
          circle.updateList.push(...datas);
          biz.page_index++;
          circle.has_next = has_next;
        } catch (error) {
          createLog(biz.modified_begin, biz.modified_end, null, "商品库存, " + "仓库: " + name, error, false) 
          reject(`商品库存请求错误, wms_co_id: ${biz.wms_co_id}` + error);
        }
      }
      async function onComplete() {
        try {
            for (const inventory of circle.updateList) {
                delete inventory.ts
                inventory.wms_co_id = biz.wms_co_id
                await prisma.inventory.upsert({
                    where: {
                      sku_id: inventory.sku_id,
                    },
                    update: inventory,
                    create: inventory,
                })
            }
            createLog(biz.modified_begin, biz.modified_end, circle.updateList.length, "商品库存", name, true) 
            resolve("ok");
        } catch (error) {
          createLog(biz.modified_begin, biz.modified_end, null, `商品库存, \n仓库名称：${name}`, error.message, false) 
          reject(`商品库存, \n仓库名称：${name}` + error.message);
        }
      }
      new CronJob(`0/5 * * * * *`, onTick, onComplete, true, "system");
  })
}

module.exports = { updateInventory }