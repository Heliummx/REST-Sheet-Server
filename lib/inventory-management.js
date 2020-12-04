const axios = require('axios');
const rateLimit = require('axios-rate-limit');

class InventoryManagement{
  
  constructor(config = {hostname: '', accessToke: '', user: '',pass: ''}){
    let buff = Buffer.from(config.user + ':' + config.pass);
    let buff_string = buff.toString('base64');
    //console.log(config.hostname + '/admin/api/2020-10/graphql.json');
    this.axiosRate = rateLimit(
      axios.create({
        baseURL: config.hostname + '/admin/api/2020-10/graphql.json' ,
        headers: {'Authorization' : `Basic ${buff_string}`},
      }), {
          maxRequest: 5,
          perMilliseconds: 1000,
          maxRPS: 5
      }
    );

    this.Querys = {
      'get-stock': {
        query: `{sku}: productVariant(id: "gid://shopify/ProductVariant/{variant_id}") {
          inventoryQuantity
        }`
      }
    }
    
    this.sendTime = undefined;
    this.bulkIDS = [];
    this.bulkDATA = [];
    
    console.log(`Basic ${buff_string}`);
  }


  addBulkChangeUpdate(variant_id, item_id, stock, shop_stock = undefined){
    const { bulkIDS, bulkDATA, sendTime } = this;
    let timestamp = Date.now();
    if( bulkDATA[variant_id] === undefined ){
      bulkIDS.push(variant_id);
      bulkDATA[variant_id] = {
        'variant_id': variant_id,
        'item_id': item_id,
        'odoo_stock': stock,
        'shop_stock': shop_stock
      }

      if( sendTime === undefined || timestamp + 1500 > sendTime ){
        this.sendTime = timestamp + 1500;
      }
      this.send();

    } else {
      bulkDATA[variant_id].odoo_stock = stock;
      this.send();
    }
    return 0;
  }

  send(){
    let timestamp = Date.now();
    let {bulkIDS, sendTime} = this;
    if( bulkIDS.length < 50){
      if( sendTime < timestamp ){


      } else {
        sendNow();
      }
    } else if(bulkIDS > 50) {
      sendNow();
    }

  }

  sendNow(){
    
    
  }

  async getStockOfProducts(variants, callback){
    const {Querys, axiosRate} = this;
    const data = {};
    const rows = [];
    for (const variant of variants) {
      let obj = Object.assign({}, Querys['get-stock']).query;
      obj = obj.replace("{variant_id}", variant.variant_id).replace("{sku}", variant.sku);
      rows.push(obj);
    }

    const object = {
      'query' : `{
        ${rows.join(" ")}
      }`
    }
    //console.log(object);  
    axiosRate.post('' , object).then(callback).catch(err => {
      console.error(err.response.data);
    });
  }


}

module.exports = InventoryManagement;