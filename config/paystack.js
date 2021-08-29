require("dotenv").config();

const paystack = (request) => {
    const MySecretKey = process.env.MY_PAYMENT_KEY
    // sk_test_xxxx to be replaced by your own secret key
    const initializePayment = (form, mycallback) => {
        const options = {
            url : 'https://api.paystack.co/transaction/initialize',
            headers : {
                authorization:"Bearer " +MySecretKey,
                'content-type': 'application/json',
                'cache-control': 'no-cache'
            },
           form
        }
        const callback = (error, response, body)=>{
            return mycallback(error, body);
        }
        request.post(options,callback);
    },
     verifyPayment = (ref, mycallback) => {
        const options = {
            url : 'https://api.paystack.co/transaction/verify/'+encodeURIComponent(ref),
            headers : {
                authorization:"Bearer " + MySecretKey,
                'content-type': 'application/json',
                'cache-control': 'no-cache'
           }
        }
        const callback = (error, response, body)=>{
            return mycallback(error, body);
        }
        request(options,callback);
    }
   return {initializePayment, verifyPayment};
}
module.exports = paystack
