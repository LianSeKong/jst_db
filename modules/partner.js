const { prisma } = require("../utils/dbConnect");
const { CallJSTAPI } = require("../utils/CallJSTAPI");
const { CronJob } = require('cron');



async function updatePartner() {
    return new Promise((res, rej) => {
        let biz = {
            page_index: 1,
            page_size: 100
        }
        const cronTime = `0/5 * * * * *`
        let hasNext = true;
        let list = [];
        
        function onTick() {
            if (hasNext) {
                CallJSTAPI('open/wms/partner/query', biz).then(response => {
                    if (response.code === 0) {
                        const { has_next = false, datas } = response.data;
                        list.push(...datas);
                        biz.page_index += 1;
                        hasNext = has_next;
                    }
                })
            } else {
                this.stop()
            }
        }
        async function onComplete() {
            for (const partner of list) {
                await prisma.partner.upsert({
                    where: {
                        wms_co_id: partner.wms_co_id,
                    },
                    update: partner,
                    create: partner,
                })
            }
            res('ok')
        }
        new CronJob(cronTime,
            onTick, 
            onComplete, 
            true, 
            'system'
        );
    })
}

module.exports = {
    updatePartner

}