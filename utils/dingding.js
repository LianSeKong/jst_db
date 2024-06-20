const axios = require('axios');
const crypto = require('crypto');


async function sendDingDing(content) {
  const baseURL = 'https://oapi.dingtalk.com'
  let robotURL = '/robot/send'
  const access_token = '7d36befa29340a98a5d0fa3f6539c5eb0b204f51745dba2b8e98ba24f89f346d'
  const secret = 'SEC98e11fecf42ff07304be1fce76bd118f3f6efac04af5eaf37e10749a25aab02f'
  const data = {
    msgtype: 'text',
    text: {
      content
    },
    at: {
      atMobiles: [
        '19339968697'
      ]
    },
  }
  const timestamp = new Date().getTime();
  const stringToSign = timestamp + '\n' + secret;
  const base = crypto.createHmac('sha256',secret).update(stringToSign).digest('base64');
  const sing = encodeURIComponent(base);
  robotURL +=`?access_token=${access_token}` +  `&timestamp=${timestamp}&sign=${sing}`;

  const instance = axios.create({ baseURL, timeout: 1000, headers: {'Content-Type': 'application/json'}});
  await instance.post(robotURL, data)
}

module.exports =  { sendDingDing }