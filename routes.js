const express = require("express");
const axios = require('axios');
const ShopifyInventoryManager = require('./lib/shopify-inventory');
require('dotenv').config();

const app = express.Router();

let configShopify = {
    'hostname': process.env.SHOPIFY_HOSTNAME,
    'user': process.env.SHOPIFY_USERNAME,
    'pass': process.env.SHOPIFY_PASSWORD
  };
  
  shopManager = new ShopifyInventoryManager(configShopify);

app.post("/", (request, res) => {
    console.log(request.body);
    res.sendStatus(200);
  });
  
    app.get("/getAllProducts", (req, res) => {
    shopManager.getAllProducts((products, index) => {        
        let filteredVariants = []
        products.forEach(product => {
        for(variant in product.variants){
            let r = product.variants[variant];
            r.tags = product.tags;
            r.vendor = product.vendor;	
            r.title=product.title+" - "+product.variants[variant].option1;

	   // console.log("OPTION 2: "+product.variants[variant].option2)
	    if(product.variants[variant].option2){
		r.title+=" "+product.variants[variant].option2;
	    }

            if(product.images[0]!=undefined){
                r.imageUrl = product.images[0].src;
            }
            else{
                r.imageUrl="";
            }

            filteredVariants.push(r);
        }
        
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
          "compareAtPrice":variant.compare_at_price,
	  "tags":variant.tags,
          "vendor":variant.vendor
        };
      })
      res.json(data);
      //console.log(data)
    });
  });
  
  
  
  app.get("/getLocations", (req, res) => {
    let location
    shopManager.getLocationId((result) => {
    res.json(result)
    })
  });
  
  app.post("/updatePrice",(req,res)=>{
         //console.log(req.body.length)
         let updates=0;
         for (let product of req.body) {
            shopManager.updatePrice(product.id, product.price, (response) => {
              updates++;
              if(updates == req.body.length){
                axios.post(process.env.SHEET_ENDPOINT, {
                  message:"Price"
               })
               .then(function (response) {})
               .catch(function (error) {
                 console.log(error);
               });     
              }
              console.log(updates+"/"+req.body.length)
            });
        }
      res.sendStatus(200);
  })
  
  app.post("/updateCompareAtPrice",(req,res)=>{
//    console.log(req.body)  
    let updates=0;
    for (let product of req.body) {
      shopManager.updateCompareAtPrice(product.id, product.compare_at_price,  (response) => {
        updates++;
        if(updates == req.body.length){
          axios.post(process.env.SHEET_ENDPOINT, {
            message:"CompareAtPrice"
         })
         .then(function (response) {})
         .catch(function (error) {
           console.log(error);
         });     
        }
        console.log(updates+"/"+req.body.length)
      })
    }
    res.sendStatus(200);
  })
  
  app.post("/updateStock",(req,res)=>{
    let locationId=process.env.LOCATION_ID;  
//    console.log(req.body);
    res.sendStatus(200);
    let updates=0;
    for (let product of req.body) {
      shopManager.updateInventory(product.inventory_item_id, product.available, locationId, (response) => {
        updates++;
        if(updates == req.body.length){
          axios.post(process.env.SHEET_ENDPOINT, {
            message:"Inventory"
         })
         .then(function (response) {})
         .catch(function (error) {
           console.log(error);
         });     
        }
        console.log(updates+"/"+req.body.length)
      })
    }
  
  })
  
  
  
  app.get("/", (req, res) => {
    res.sendStatus(200);
  })

module.exports=app;
