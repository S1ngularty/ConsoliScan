const Queue = require("../models/checkoutQueueModel")

 exports.checkout = async(request)=>{
    if(!request.body) throw new Error("empty request content")
    console.log(request.body)
}