require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  //plaintex password = pokhara@135790 and @ should be converted using percentage encoding where @=%40
  "mongodb+srv://" +
    process.env.USERNAME +
    ":" +
    process.env.PASSWORD +
    "@cluster1.m0qmn.mongodb.net/todolistDB"
);

const itemsSchema = mongoose.Schema({
  name: String,
});

const Item = mongoose.model("Item", itemsSchema);

const buyFood = new Item({
  name: "Buy Fod",
});
const cookFood = new Item({
  name: "Cook Food",
});
const eatFood = new Item({
  name: "Eat Food",
});

const defaultItems = [buyFood, cookFood, eatFood];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  const day = "Today";
  Item.find({}, function (err, foundItems) {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Items added to the database");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: day, newListItems: foundItems });
    }
  });
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne(
    {
      name: customListName,
    },
    function (err, foundList) {
      if (!err) {
        if (!foundList) {
          //Create a new list
          const list = new List({
            name: customListName,
            items: defaultItems,
          });
          list.save();
          res.redirect("/" + customListName);
        } else {
          //Show an existing list
          res.render("list", {
            listTitle: customListName,
            newListItems: foundList.items,
          });
        }
      }
    }
  );
});

app.post("/", function (req, res) {
  const newItem = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: newItem,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function (err) {
      if (!err) {
        console.log("Successfully deleted checked item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/work", function (req, res) {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", function (req, res) {
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function () {
  console.log("Server has started successfully");
});
