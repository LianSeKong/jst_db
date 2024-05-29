const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require('cron');
const moment = require('moment')
const formatStr = "YYYY-MM-DD HH:mm:ss";

begin()

// get all partner

async function getAllpartner() {
    return await prisma.partner.findMany()
}


async function begin() {
    const partnerList = await getAllpartner()
    partnerList.forEach(partner => {
        parallel(partner.wms_co_id)
    })
}

function parallel(wms_co_id) {
    let biz = {
        wms_co_id: wms_co_id,
        page_index: 1,
        modified_begin: "2024-05-29 00:00:00",
        modified_end: "2024-05-29 12:00:00",
        has_lock_qty: true,
        page_size: 100
    }
    /**
     * 1. 请求数据（一次请求七天）
     *    *  每五秒一次
     *    *  将数据存储在list中
     *    *  不断循环直到时间为2020年
     *    *  当list的长度大于10000时， 进行数据库操作
     *    *  list清空
     */
    const cronTime =  `0/5 * * * * *`
    let hasNext = true;
    let list = [];
    let isInOperation = false;
    new CronJob(cronTime, 
        function () {
            if (hasNext) {
                if (!isInOperation) {
                    if (list.length > 1000) {
                        isInOperation = true
                        const excuList = []
                        list.forEach((element) => {
                            delete element.ts
                            element.wms_co_id = biz.wms_co_id
                            const update = {...element }
                            delete update.sku_id
                            excuList.push(prisma.inventory.upsert({
                                where: {
                                  sku_id: element.sku_id,
                                },
                                update,
                                create: element,
                            }))
                        })
                        list = []
                        Promise.all(excuList).then(
                            res => {
                                console.log(res);
                                isInOperation = false
                            }
                        )
                        console.log('finish part: ', biz);
                    }
                    CallJSTAPI('open/inventory/query', biz).then(res => {
                       
                            if (res.code === 0) {
                                console.log(res.data.inventorys.length);
                                const { has_next = false, inventorys } = res.data;
                                list.push(...inventorys);
                                biz.page_index += 1;
                                hasNext = has_next;
                            }
                    })
                }
            } else {
                // 增加时间周期
                biz = goToNext(biz)
                if (biz.modified_begin > new moment().format(formatStr)) {
                    this.stop();
                }
                hasNext = true
            }
        }, // onTick
        function () {
            if (list.length > 0) {
                list.forEach( async (element) => {
                    delete element.ts
                    element.wms_co_id = biz.wms_co_id
                    const update = {...element }
                    delete update.sku_id
                    await prisma.inventory.upsert({
                        where: {
                          sku_id: element.sku_id,
                        },
                        update,
                        create: element,
                    })
                })
                list = []
                console.log('full finish');
            }
        }, // onComplete
        true, // start
        'system'
    );
}





// 递增周期
function increaseTime(modified_begin, modified_end) {
    modified_begin = new moment(modified_begin).add(7, "days").format(formatStr)
    modified_end = new moment(modified_end).add(7, "days").format(formatStr)
    return { modified_begin, modified_end }
}

// 增量更新后7天
function goToNext (biz) {
    const currentTime = increaseTime(biz.modified_begin, biz.modified_end)
    return {
        wms_co_id: biz.wms_co_id,  // 分仓公司编号
        page_index: 1,
        modified_begin: currentTime.modified_begin,
        modified_end: currentTime.modified_end,
        has_lock_qty: biz.has_lock_qty,
        page_size: biz.page_size
    }
}

