const ShopifyInventoryManager = require('./lib/shopify-inventory');
const express = require("express");
require('dotenv').config();


let configShopify = {
  'hostname': process.env.SHOPIFY_HOSTNAME,
  'user': process.env.SHOPIFY_USERNAME,
  'pass': process.env.SHOPIFY_PASSWORD
};

shopManager = new ShopifyInventoryManager(configShopify);


const app = express();
const PORT = process.env.PORT || 5000;
const basicAuth = require('express-basic-auth')

app.use(express.urlencoded({
  extended: false
}));

app.use(express.json());

app.use(basicAuth({
  users: { process.env.HTTP_USER: process.env.HTTP_PASS }
}))

app.post("/", (request, res) => {
  console.log(request.body);
  res.sendStatus(200);
});

app.get("/getAllProducts", (req, res) => {
  shopManager.getAllProducts((products, index) => {
    let filteredVariants = products.map((product) => {
      let r = product.variants[0];
      r.title=product.title;
      r.imageUrl = product.images[0].src;
      return r;
    });
    let data = filteredVariants.map((variant) => {
      return {
        "sku":variant.sku,
        "title":variant.title,
        "variantId":variant.id,
        "inventoryId":variant.inventory_item_id,
        "price":variant.price,
        "stock":variant.inventory_quantity,
        "imageURL":variant.imageUrl,
        "compareAtPrice":variant.compare_at_price
      };
    })
    res.json(data);
  //  console.log(data)
  });
});



app.get("/getLocations", (req, res) => {
  let location
  shopManager.getLocationId((result) => {
    console.log(result)
  })
});

app.post("/updatePrice",(req,res)=>{
    console.log(req.body);
    res.sendStatus(200);

    for (let product of req.body) {
      shopManager.updatePrice(
        product.id,
        product.price)
    }
})

app.post("/updateCompareAtPrice",(req,res)=>{
  console.log(req.body);
  res.sendStatus(200);

  for (let product of req.body) {
    shopManager.updateCompareAtPrice(
      product.id,
      product.compare_at_price)
  }
})

app.post("/updateStock",(req,res)=>{
  let locationId="38478151812";
  console.log(req.body);
  res.sendStatus(200);

  for (let product of req.body) {
    shopManager.updateInventory(
      product.inventory_item_id, 
      product.available, 
      locationId)
  }

})



app.get("/", (req, res) => {
  res.sendStatus(200);
})

app.listen(PORT, () => {
  console.log(`Started on PORT ${PORT}`);
})