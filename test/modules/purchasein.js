

const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require('cron');
const { foramtRequestError, foramtRequestDBInsert } = require('../utils/tools')


function getPurchaseinList(modified_begin, modified_end) {
    return new Promise((res, rej) => {
        let biz = {
            page_index: 1,
            page_size: 50,
            modified_begin,
            modified_end,
            po_ids: [],
            so_ids: [],
            statuss: [],
            // ts: new Date().getTime()
        }
        const cronTime = `0/7 * * * * *`
        let hasNext = true;
        let list = [];
        let itemList = [];
    
        new CronJob(cronTime,
            async function () {
                if (hasNext) {
                    try {
                        const response = await CallJSTAPI("open/purchasein/query", biz)
                        if (response.code === 0) {
                            const { has_next = false, datas } = res.data;
                            if (datas instanceof Array) {
                                const items = datas.flatMap(item => item.items)
                                    .filter(item => item instanceof Object)
                                itemList.push(...items)
                                const updateItemList = datas.map(item => {
                                    delete item.items
                                    delete item.ts
                                    return item
                                })
                                list.push(...updateItemList)
                            }
                            biz.page_index += 1;
                            hasNext = has_next;
                        } else {
                            hasNext = false;
                            foramtRequestError(biz, '采购入库请求错误', response)
                        }
                    } catch (error) {
                        hasNext = false;
                        foramtRequestError(biz, '采购入库网络错误', error)
                    }
                } else {
                    this.stop()
                }
            }, // onTick
            async function () {
                const result = await updateOrInsertDB(list, itemList)
                foramtRequestDBInsert(biz, '采购入库', {
                    '采购入库主表': result.list,
                    '采购入库子表': result.itemList,
                } )
                res('ok')
            }, // onComplete
            true, // start
            'system'
        );
    })
}


// 数据库更新
async function updateOrInsertDB(list, itemList) {
    try {
        for (const purchasein of list) {
            await prisma.purchasein.upsert({
                where: {
                    io_id: purchasein.io_id,
                },
                update: purchasein,
                create: purchasein,
            })
        }
        for (const purchaseinItem of itemList) {
            await prisma.purchasein_item.upsert({
                where: {
                    ioi_id: purchaseinItem.ioi_id,
                },
                update: purchaseinItem,
                create: purchaseinItem,
            })
        }
        return {
            list: list.length,
            itemList: itemList.length
        }
    } catch (e) {
        console.log(e);
        return {
            list: 0,
            itemList: 0
        }
    }
}


module.exports = { getPurchaseinList }