require('dotenv').config();

const InventoryManagement = require('./lib/inventory-management');

function main(){
  let BulkManager = new InventoryManagement({
    hostname: process.env.AGROBOLDER_HOSTNAME,
    user: process.env.AGROBOLDER_USER,
    pass: process.env.AGROBOLDER_PASS
  })
  
  let variants = [
    {'sku': 'abc', 'variant_id': 37592894472385},
    {'sku': 'cbd', 'variant_id': 37607642693825},
    {'sku': 'hgi', 'variant_id': 37607642726593},
    {'sku': 'ijk', 'variant_id': 37607642759361}
  ];
  console.log(variants);
  BulkManager.getStockOfProducts(variants, (res) => {
    console.log(res.data);
  })
}


main();
