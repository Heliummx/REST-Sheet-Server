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


  addBulkChangeUpdate(sku, variant_id, item_id, stock, shop_stock = undefined){
    const { bulkIDS, bulkDATA, sendTime } = this;
    await ( getCurrentStock() );
    let timestamp = Date.now();
    
    if( bulkDATA[sku] === undefined ){
      bulkIDS.push(sku);
      bulkDATA[sku] = {
        'sku': sku,
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
      bulkDATA[sku].odoo_stock = stock;
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
    } else if( bulkIDS > 50 ) {
      sendNow();
    }

  }

  async sendNow(){
    let test = await this.getCurrentStock()
    console.log(test);
    
    
  }

  async getCurrentStock(){
    const {bulkDATA} = this;
    const filteredData = bulkDATA.filter((el) => {
      return el.shop_stock !== undefined;
    });
    if(filteredData.length > 0){
      filteredData = filteredData.map((el) => {
        return {
          'sku': el.sku,
          'variant_id': el.variant_id
        }
      })

      await this.getStockOfProducts(filteredData, (res) => {
        for (const sku in res.data.data) {
          const shopProduct = res.data.data[sku];
          console.log(sku, shopProduct);
          bulkDATA[sku].shop_stock =shopProduct.inventoryQuantity;
        }
        return 'ok';
      });
    }

    return 'ok'
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