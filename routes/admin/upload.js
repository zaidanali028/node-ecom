let newProduct = new Product({
  name: req.body.name,
  description: req.body.desc,
  richDescription: req.body.rdesc,
  category: req.body.category,
  price: req.body.price,
  countInStock: req.body.stockCount,
  isFeatured: req.body.feature,
  isFiftyOff: req.body.dsc,

//  image: urls,
  worth: req.body.worth,
  discount: disCount,
  originalCountInStock: req.body.stockCount,
});

newProduct = await newProduct.save();
if (newProduct.isFiftyOff == true) {
  let offCalc =newProduct.price -(50 / 100) * newProduct.price;
  newProduct=await Product.findByIdAndUpdate({_id:newProduct._id},{
    $set:{
      price:offCalc

    }
  },{new: true})

 }

req.flash("success_msg", `Successfully Added ${newProduct.name}`);
res.redirect("/admin/products/all");















try {
  Product.findById(req.params.id).then(async (product) => {
    let files = [req.files];
    //an array of 4 items
    let urls = new Array(4);

    files = files[0].image;

    //an instance of the cloudingary module
    const uploader = async (path) =>
      await cloudinary.uploads(path, "Images");
    //wil be expecting 4 fies from the user,so am doing a forloop fro 0-3
    for (var i = 0; i < 4; i++) {
      let currentFile =
        typeof files[i] == "undefined" ? product.image[i] : files[i];
      // if the user does not define an index for a  specific file,I use the old picture in the db for that index
      if (typeof currentFile == "object") {
        // if the current file is a file object and nota url,I upload and assign the new url to that specific index
        let tmp_file = currentFile.tempFilePath;
        // currentFile is either url or tempfile path
        const newPath = await uploader(tmp_file);
        urls[i] = newPath;
        fs.unlinkSync(tmp_file);
      } else {
        urls[i] = currentFile;
      }
    }
    //console.log(urls)
    console.log(urls);
    Product.findByIdAndUpdate(
      { _id: req.params.id },
      {
        $set: {
          name: req.body.name,
          description: req.body.desc,
          richDescription: req.body.rdesc,
          category: req.body.category,
          price: req.body.price,
          countInStock: req.body.stockCount,
          feature: req.body.feature,
          image: urls,
        },
      },
      { new: true }
    ).then((updatedProduct) => {
      req.flash(
        "success_msg",
        `Successfully Updated ${updatedProduct.name}`
      );

      res.redirect("/admin/products/all");
    });
  });
} catch (e) {
  console.log(e.message);
}