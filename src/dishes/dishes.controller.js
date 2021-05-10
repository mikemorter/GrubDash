const { setupMaster } = require("cluster");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass
// add handlers and middleware functions to create, read, update, and list dishes. Note that dishes cannot be deleted.

function bodyHasNameProperty(req, res, next) {
  const { data: { name } = {} } = req.body;
  if (name) {
    return next();
  }
  next({
    status: 400,
    message: "A 'name' property is required.",
  });
}

function bodyHasDescriptionProperty(req, res, next) {
  const { data: { description } = {} } = req.body;
  if (description) {
    return next();
  }
  next({
    status: 400,
    message: "A 'description' property is required.",
  });
}

function bodyHasPriceProperty(req, res, next) {
  const { data: { price } = {} } = req.body;
  if (price && price > 0 && typeof price === "number") {
    return next();
  }
  next({
    status: 400,
    message: "A 'price' property is required.",
  });
}

function bodyHasImageProperty(req, res, next) {
  const { data: { image_url } = {} } = req.body;
  if (image_url) {
    return next();
  }
  next({
    status: 400,
    message: "A 'image_url' property is required.",
  });
}

function create(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  const newDish = {
    id: nextId(),
    name,
    description,
    price,
    image_url,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
}

function destroy(req, res, next) {
  next({
    status: 405,
    message: "A dish cannot be deleted.",
  });
}

function dishExists(req, res, next) {
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id == dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}`,
  });
}

function list(req, res, next) {
  res.status(200).json({ data: dishes });
}

function read(req, res, next) {
  res.json({
    data: res.locals.dish,
  });
}

function idMatch(req, res, next) {
  const dish = res.locals.dish;
  const { data: { id } = {} } = req.body;
  const { dishId } = req.params;
  if (id && dishId != id) {
    return next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`,
    });
  }
  next();
}

function update(req, res, next) {
  const dish = res.locals.dish;
  const { data: { name, description, price, image_url } = {} } = req.body;
  dish.name = name;
  dish.description = description;
  dish.price = price;
  dish.image_url = image_url;
  res.json({ data: dish });
}

module.exports = {
  create: [
    bodyHasNameProperty,
    bodyHasDescriptionProperty,
    bodyHasPriceProperty,
    bodyHasImageProperty,
    create,
  ],
  list,
  read: [dishExists, read],
  update: [
    dishExists,
    bodyHasNameProperty,
    bodyHasDescriptionProperty,
    bodyHasPriceProperty,
    bodyHasImageProperty,
    idMatch,
    update,
  ],
  delete: [destroy],
};
