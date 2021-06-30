function coupongenerator() {
    var coupon = "";
    var possible = "abcdefghijklABCDEFGHIJFLMNOPmnopqrstuvwxyzQRSTUVWXYZ0123456789";
    for (var i = 0; i <10; i++) {
    coupon += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return coupon;
    }
    module.exports = coupongenerator;