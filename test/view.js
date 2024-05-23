const { prisma } = require("../utils/dbConnect");
prisma.purchase_item.createMany({
    data : [
        {
            delivery_date: '2022-09-27 18:00:00'
        }
    ]
  }).then(res => {
    console.log(res);
  })