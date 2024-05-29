const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require('cron');




let biz = {
    page_index: 1,
    page_size: 100
}
const cronTime = `0/5 * * * * *`
let hasNext = true;
let list = [];

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

new CronJob(cronTime, 
    function () {
        if (hasNext) {
            CallJSTAPI('open/wms/partner/query', biz).then(res => {
                if (res.code === 0) {
                    const { has_next = false, datas } = res.data;
                    list.push(...datas);
                    biz.page_index += 1;
                    hasNext = has_next;
                }
        })
        } else {
            this.stop()
        }
    }, // onTick
    async function () {        
        for (const partner of list) {
            await prisma.partner.upsert({
                where: {
                  wms_co_id: partner.wms_co_id,
                },
                update: partner,
                create: partner,
            })
        }
    }, // onComplete
    true, // start
    'system'
);