const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require('cron');
const moment = require('moment')


interface biz {
    wms_co_id: number,  // 分仓公司编号
    page_index: number,
    modified_begin: string,
    modified_end: string,
    has_lock_qty: boolean,
    page_size: number
}

interface ReturnVal {
    sku_id: string,
    i_id: string,
    name: string,
    qty: number,
    order_lock: number,
    pick_lock: number,
    virtual_qty: number,
    purchase_qty: number,
    return_qty: number,
    in_qty: number,
    lock_qty: string,
    defective_qty: number,
    modified: string,
    min_qty: number,
    max_qty: number,
    customize_qty_1: number,
    customize_qty_2: number,
    customize_qty_3: number,
    allocate_qty: number
}

// 递增周期
function increaseTime(modified_begin:string, modified_end:string) {
    modified_begin = new moment(modified_begin).add(7, "days")
    modified_end = new moment(modified_end).add(7, "days")
    return { modified_begin, modified_end }
}

// 增量更新后7天
function goToNext(modified_begin:string, modified_end:string):biz {
    const currentTime = increaseTime(modified_begin, modified_end)
    const returnVal: biz =  {
        wms_co_id: 0,  // 分仓公司编号
        page_index: 1,
        modified_begin: currentTime.modified_begin,
        modified_end: currentTime.modified_end,
        has_lock_qty: true,
        page_size: 100
    }
    return returnVal
}

let queryParams: biz = {
    wms_co_id: 0,
    page_index: 1,
    modified_begin: "2020-01-01 00:00:00",
    modified_end: "2020-01-08 00:00:00",
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
 *   
 * 
 */
const cronTime = '0 0/5 * * * *';
let hasNext = true;
let list = [];
let isInOperation = false;
new CronJob(cronTime, 
    async function () {
        if (hasNext) {
            if (!isInOperation) {
                CallJSTAPI('open/inventory/query', queryParams).then(res => {
                    if (res.code === 0) {
                        const { has_next = false, inventorys } = res.data;
                        list.push(...inventorys);
                        queryParams.page_index += 1;
                        hasNext = has_next;
                    }
                })
            }
        } else {
            // 增加时间周期

        }
        CallJSTAPI('open/inventory/query', biz).then(res => {
            console.log(res.data.inventorys);
            res.data.inventorys.forEach( async (element) => {
                delete element.ts
                const update = {...element}
                delete update.sku_id
                const upsertUser = await prisma.inventory.upsert({
                    where: {
                      sku_id: element.sku_id,
                    },
                    update,
                    create: element,
                })
                console.log(upsertUser);
            })
        })
    }, // onTick
    function () {

    }, // onComplete
    true, // start
    'system'
);


