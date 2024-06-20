const { CronJob } = require('cron');

function onTick() {
    setTimeout(() => {
        this.stop()
    }, 3000)
}

function onComplete() {
    console.log('complete');
}
new CronJob('0 * * * * *', onTick, onComplete,true, 'system')