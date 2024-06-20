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
  return new Promise((resolve, reject) => {
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
    let inventoryList = [];
    let isOper = false;
    const URL = 'open/inventory/query'


    async function onTicK() {
        // 接口调用阻塞中
        if (isOper) return; // 正在数据库操作则直接进行下一次轮询
         // 数据量达到阈值则进行数据库操作，阻塞接口调用
        if (inventoryList.length > 2000) {
            isOper = true;
            inventoryList = await operateDB(inventoryList);
            isOper = false;
            return;
        }

        // 数据获取完毕
        if (hasNext === false) {
            this.stop();
            return;
        }

        try {
        //发送请求，获取数据
        const response = await CallJSTAPI(URL, biz);
        // 请求出错, 抛出错误
        if (response.code !== 0) {
          reject(formatResponseError( `商品库存请求错误, wms_co_id: ${biz.wms_co_id}`, biz, response.msg));
          return;
        }

        const { data } = response;
        const { datas = [], has_next = false } = data;

        if (datas instanceof Array) {
            inventoryList.push(...datas);
        }

        // 下次循环
        hasNext = has_next;
        biz.page_index++;
      } catch (error) {
        reject( `商品库存请求错误, wms_co_id: ${biz.wms_co_id}: `, error.message);
      }


    }



    function operateDATABASE() {
        



    }


    new CronJob(cronTime, 
        async function () {
            if (hasNext) {
                const response = await CallJSTAPI('open/inventory/query', biz)
                if (response.code === 0) {
                    const { has_next = false, inventorys } = response.data;
                    if (inventorys instanceof Array) {
                        inventoryList.push(...inventorys);
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
            for (const inventory of inventoryList) {
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
                '插入|更新': inventoryList.length
            })
            resolve('ok')
        }, // onComplete
        true, // start
        'system'
    );
  })
}

module.exports = { getInventoryList }