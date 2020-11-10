const axios = require('axios');
const rateLimit = require('axios-rate-limit');

class ShopifyInventoryManager {
    constructor(config = {
        hostname: '',
        accessToke: '',
        user: '',
        pass: ''
    }) {
        this.CONFIG = config;
        this.axiosRate = rateLimit(
            axios.create(), {
                maxRequest: 2,
                perMilliseconds: 1000,
                maxRPS: 2
            }
        );
    }

    getURL(relativeRoute) {
        const CONFIG = this.CONFIG;
        return `https://${CONFIG.hostname}${relativeRoute}`;
    }

    getAuth() {
        return {
            username: this.CONFIG.user,
            password: this.CONFIG.pass
        }
    }

    async getAllProducts(callback) {
        const Axios = this.axiosRate;
        const RELATIVE_ROUTE = "/admin/api/2020-07/products.json";
        let URL = this.getURL(RELATIVE_ROUTE);
        const COUNT_ALL_PRODUCTS = await this.getCountAllProducts();
        const PAGE_SIZE = 250;
        const ALL_PAGES = Math.ceil(COUNT_ALL_PRODUCTS / PAGE_SIZE);
        const AUTH_DATA = this.getAuth();

        //Paginate From Start to Finish.
        let allProducts = [];
        let index;
        for (let i = 0; i < ALL_PAGES; i++) {
            try {
                let newData = await Axios.get(URL, {
                    auth: AUTH_DATA,
                    params: {
                        limit: PAGE_SIZE
                    }
                });
                //console.log(newData.data.products[0]);
                allProducts = allProducts.concat(newData.data.products);
                URL = newData.headers.link;
                console.log(i)
                index = i;
                // Extraer siguiente URL 
                if(i + 1 !== ALL_PAGES){
                    let start = URL.lastIndexOf("<") + 1;
                    let end = URL.lastIndexOf(">");
                    URL = URL.substr(start, end - start);
                }

            } catch (error) {
                console.log(error);
                callback(-1);
            }
        }
        callback(allProducts, index);
    }

    async getAllProductsBySKU(callback) {

        this.getAllProducts((products) => {
            let productsVariants = products.map((val) => {
                let curr = val.variants.map((variant) => {
                    return {
                        'sku': variant.sku,
                        'inventory_item_id': variant.inventory_item_id
                    }
                })
                return curr;
            });
            callback(productsVariants);
        });

    }

    async getCountAllProducts() {
        const Axios = this.axiosRate;
        const PARAMS = {
            auth: this.getAuth()
        }
        //console.log(PARAMS);
        const RELATIVE_ROUTE = "/admin/api/2020-07/products/count.json";
        const URL = this.getURL(RELATIVE_ROUTE)
        console.log(URL, PARAMS);
        try {
            let result = await Axios.get(URL, PARAMS);
            return result.data.count;
        } catch (error) {
            //console.error(error);
            return -1;
        }
    }

    async updatePrice(variantId, newPrice) {
        // Get Current Inventory ID
        const Axios = this.axiosRate;
        const RELATIVE_ROUTE = "/admin/api/2020-07/variants/"+variantId+".json";
        const URL = this.getURL(RELATIVE_ROUTE);
        let data = {variant:{
            'id': variantId,
            'price': newPrice,
        }}
        console.log(data);
        Axios.put(URL, data, {auth: this.getAuth()} )    
             .then((response) => {
                 console.log(response.data);
             })
             .catch((err) => {
                 console.log(err);
             })
        
        //console.log(data);
    }

    async updateCompareAtPrice(variantId, newComparePrice) {
        // Get Current Inventory ID
        const Axios = this.axiosRate;
        const RELATIVE_ROUTE = "/admin/api/2020-07/variants/"+variantId+".json";
        const URL = this.getURL(RELATIVE_ROUTE);
        let data = {variant:{
            'id': variantId,
            'compare_at_price': newComparePrice,
        }}
        console.log(data);
        Axios.put(URL, data, {auth: this.getAuth()} )    
             .then((response) => {
                 console.log(response.data);
             })
             .catch((err) => {
                 console.log(err);
             })
        
        //console.log(data);
    }

    async updateInventory(inventoryId, newStock, locationId) {
        // Get Current Inventory ID
        const Axios = this.axiosRate;
        const RELATIVE_ROUTE = "/admin/api/2020-07/inventory_levels/set.json";
        const URL = this.getURL(RELATIVE_ROUTE);
        let data = {
            'inventory_item_id': inventoryId,
            'location_id': locationId,
            'available': newStock
        }
        Axios.post(URL, data, {
                auth: this.getAuth()
            })
            .then((response) => {
                console.log(response.data);
            })
            .catch((err) => {
                console.log(err);
            })
        console.log("url in lib:");
        console.log(URL);
    }

    async getLocationId(callback) {
        const Axios = this.axiosRate;
        const PARAMS = {
            auth: this.getAuth()
        };
        const RELATIVE_ROUTE = "/admin/api/2020-07/locations.json";
        const URL = this.getURL(RELATIVE_ROUTE);

        try {
            let data = await Axios.get(URL, PARAMS);
            //console.log(data.data);
            callback(data.data.locations[0].id);
        } catch (error) {
            console.log({
                "message": "Error obteniendo en la localizacion"
            });
            callback(-1);
        }
         
    }

}

module.exports = ShopifyInventoryManager;
