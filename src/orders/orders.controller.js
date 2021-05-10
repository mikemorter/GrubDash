const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
const validStatus = ["pending", "preparing", "out-for-delivery", "delivered"];

function bodyHasDeliverProperty(req, res, next) {
  const { data: { deliverTo } = {} } = req.body;
  if (deliverTo) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a deliverTo.",
  });
}

function bodyHasMobileNumberProperty(req, res, next) {
  const { data: { mobileNumber } = {} } = req.body;
  if (mobileNumber) {
    return next();
  }
  next({
    status: 400,
    message: "Order must include a mobileNumber.",
  });
}

function bodyHasDishesProperty(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (Array.isArray(dishes) && dishes.length > 0) {
    return next();
  }
  next({
    status: 400,
    message: `Order must include a dish ${dishes}`,
  });
}

function bodyDishQuantityProperty(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  dishes.forEach((dish) => {
    const quantity = dish.quantity;
    if (!quantity || quantity <= 0 || typeof quantity !== "number") {
      return next({
        status: 400,
        message: `Dish ${dish.id} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
}

function OrderIsPending(req, res, next) {
  const { status } = ({} = res.locals.order);
  if (status !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending order status: ${status}`,
    });
  }
  next();
}

function resultStatusIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (validStatus.includes(status)) {
    return next();
  }
  next({
    status: 400,
    message: `Value of the 'status' property must be one of ${validStatus}. Received: ${status}`,
  });
}

function create(req, res, next) {
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  const newOrder = {
    id: nextId(),
    deliverTo,
    mobileNumber,
    status,
    dishes,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
}

function destroy(req, res) {
  const { orderId } = req.params;
  const index = orders.findIndex((order) => order.id == orderId);
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
}

function orderExists(req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id === orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    return next();
  }
  next({
    status: 404,
    message: `Order id not found: ${orderId}`,
  });
}

function list(req, res) {
  const { orderId } = req.params;
  const byResult = orderId ? (order) => order.result === orderId : () => true;
  res.json({ data: orders.filter(byResult) });
}

function read(req, res, next) {
  res.json({ data: res.locals.order });
}

function idMatch(req, res, next) {
  const { data: { id } = {} } = req.body;
  const { orderId } = req.params;
  if (id && orderId !== id) {
    return next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}`,
    });
  }
  next();
}

function update(req, res, next) {
  const order = res.locals.order;
  const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  order.deliverTo = deliverTo;
  order.mobileNumber = mobileNumber;
  order.status = status;
  order.dishes = dishes;
  res.json({ data: order });
}

module.exports = {
  create: [
    bodyHasDeliverProperty,
    bodyHasMobileNumberProperty,
    bodyHasDishesProperty,
    bodyDishQuantityProperty,
    create,
  ],
  list,
  read: [orderExists, read],
  update: [
    orderExists,
    bodyHasDeliverProperty,
    bodyHasMobileNumberProperty,
    bodyHasDishesProperty,
    bodyDishQuantityProperty,
    resultStatusIsValid,
    idMatch,
    update,
  ],
  delete: [orderExists, OrderIsPending, idMatch, destroy],
};
