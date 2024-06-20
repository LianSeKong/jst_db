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
    for (const partner of partnerList) {
       await parallel(partner.wms_co_id, partner.name,modified_begin, modified_end)
    }
}

function parallel(wms_co_id, name, modified_begin, modified_end) {
  return new Promise((res, rej) => {
    let biz = {
        wms_co_id: wms_co_id,
        page_index: 1,
        modified_begin,
        modified_end,
        has_lock_qty: true,
        page_size: 100
    }

    const cronTime =  `0/5 * * * * *`
    let hasNext = true;
    let list = [];

    new CronJob(cronTime, 
        async function () {
            if (hasNext) {
                const response = await CallJSTAPI('open/inventory/query', biz)
                if (response.code === 0) {
                    const { has_next = false, inventorys } = response.data;
                    if (inventorys instanceof Array) {
                        list.push(...inventorys);
                    }
                    biz.page_index += 1;
                    hasNext = has_next;
                } else {
                    hasNext = false
                    throw new Error( foramtRequestError(biz, `商品库存请求错误, wms_co_id: ${biz.wms_co_id}`, response))
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
            foramtRequestDBInsert(biz, `商品库存, \n仓库名称：${name}`, {
                '插入|更新': list.length
            })
            res('ok')
        }, // onComplete
        true, // start
        'system'
    );
  })
}

module.exports = { getInventoryList }