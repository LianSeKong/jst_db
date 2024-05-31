const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require('cron');
const { foramtRequestError, foramtRequestDBInsert } = require('../utils/tools')

// get all partner
async function getAllpartner() {
    return await prisma.partner.findMany()
}

async function getInventoryList(modified_begin, modified_end) {
    const partnerList = await getAllpartner()
    parallel(10550862, modified_begin, modified_end)
    return;
    for (const partner of partnerList) {
      await parallel(partner.wms_co_id, modified_begin, modified_end)
    }
}

function parallel(wms_co_id, modified_begin, modified_end) {
  return new Promise((res, rej) => {
    let biz = {
        wms_co_id: wms_co_id,
        page_index: 1,
        modified_begin,
        modified_end,
        has_lock_qty: true,
        page_size: 100
    }

    const cronTime =  `0/7 * * * * *`
    let hasNext = true;
    let list = [];

    new CronJob(cronTime, 
        async function () {
            if (hasNext) {
                try {
                   
                    const response = await CallJSTAPI('open/inventory/query', biz)
                    console.log(biz, response);
                    if (response.code === 0) {
                        const { has_next = false, inventorys } = res.data;
                        if (inventorys instanceof Array) {
                            list.push(...inventorys);
                        }
                        biz.page_index += 1;
                        hasNext = has_next;
                    } else {
                        hasNext = false
                        foramtRequestError(biz, `商品库存请求错误, wms_co_id: ${biz.wms_co_id}`, response)
                    }
                } catch (error) {
                    console.log(biz ,error);
                    hasNext = false
                    foramtRequestError(biz, `商品库存请求网络错误, wms_co_id: ${biz.wms_co_id}`, error)
                }
            } else {
                this.stop()
            }
        }, // onTick
        async function () {
            for (const inventory of list) {
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
            foramtRequestDBInsert(biz, '商品库存', {
                '插入|更新': list.length,
                "wms_co_id": biz.wms_co_id
            })
            res('ok')
        }, // onComplete
        true, // start
        'system'
    );
  })
}

module.exports = { getInventoryList }