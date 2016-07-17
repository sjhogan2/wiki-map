"use strict";
require('dotenv').config();
require('dotenv').config();

const PORT        = process.env.PORT || 8080;
const ENV         = process.env.ENV || "development";
const express     = require("express");
const bodyParser  = require("body-parser");
const sass        = require("node-sass-middleware");
const app         = express();
const methodOverride = require('method-override')
const cookieParser = require('cookie-parser')

const knexConfig  = require("./knexfile");
const knex        = require("knex")(knexConfig[ENV]);

const usersRoutes = require("./routes/users");
const mapsRoutes = require("./routes/maps");
const pinsRoutes = require("./routes/pins");

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/styles", sass({
  src: __dirname + "/styles",
  dest: __dirname + "/public/styles",
  debug: true,
  outputStyle: 'expanded'
}));
app.use(express.static("public"));
// app.use(express.static("node-modules/bootstrap"));
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(methodOverride('_method'));

//Users JSON api
app.use("/api/users", usersRoutes(knex));
app.use("/api/maps", mapsRoutes(knex));
app.use("/api/pins", pinsRoutes(knex));

// npm install express validator and app.use(expressValidator), then should work
// item needs to be the params you are passing - could also just use for
// specific user route
// i.e. req.sanitize(req.body.email).escape()
// app.use((req, res, next) => {
//   for (let item in req.params){
//     req.sanitize(item).escape();
//   }
//   next();
// });

app.get("/maps", (req, res) => {
  knex.select('*').from('maps').then((results) => {
  res.render("index", {maps: results, user_id: req.cookies["user_id"]});
  });
});

app.get("/login", (req, res) => {
  res.render("login", {user_id: req.cookies["user_id"]})
});

app.post("/login", (req, res) => {
  knex.select('id')
  .from('users')
  .where({'email': req.body.email,
  'password': req.body.password})
  .then((results) => {
    if (results.length === 1) {
      let user_id = results[0].id;
      res.cookie("user_id", user_id);
      res.redirect("/maps");
    } else {
      res.redirect("/login");
    }
  });
});

app.delete("/maps/:id/pins/:pinid", (req, res) => {
    knex('pins')
    .where('id', req.params.pinid).del().then((resuts) => {
      res.json(resuts);
    });

});

app.post("/signup", (req, res) => {
  knex('users').insert({
  'email': req.body.email,
  'password': req.body.password,
  'name': req.body.username})
  .returning("id")
  .then((results) => {
    let user_id = results[0];
    res.cookie("user_id", user_id);
    res.redirect("/maps");
  });
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/login");
});

app.get("/user", (req, res) => {
  knex.select('*').from('maps').then((results) => {
  res.render("user-profile", {users: results});
  });
});

app.get("/maps/:id/edit", (req, res) => {
  knex.select('id','title').from('maps').where('id', req.params.id).then((results) => {
    let templateVars = {
      id: results[0].id,
      title: results[0].title,
      user_id: req.cookies["user_id"]
    }
    res.render("edit", templateVars);
  });
});

app.post("/maps", (req, res) => {
  knex('maps').returning("id").insert({
    title: "Edit this Title",
    latitude: 49.2827,
    longitude: -123.1207,
    user_id: req.cookies["user_id"]
    })
    .then((results) => {
      let id = results[0];
      res.redirect(`/maps/${id}/edit`);
    });
});


// app.post("/maps/:id/pins", (req, res) => {
  
//   knex('pins').insert({
//     'title': req.body.title,
//     'description': req.body.description,
//     'latitude': req.body.latitude,
//     'longitude': req.body.longitude,
//     'map_id': req.params.id,
//     'pin_type': "create",
//     'original_pin_id': 0,
//     'user_id': req.cookies["user_id"]})
//     .then((results) => {

//   });
//      //res.redirect("/maps");

// });

// app.put("/maps/:id", (req, res) => {
//   knex('maps')
//   .where('id', req.params.id).update({
//   title: req.body.title,
//   updated_at: new Date()})
//   .then((results) => {
//     res.json(results);
//   });
// });

app.delete("/maps/:id", (req, res) => {
  knex('maps')
  .where('id', req.params.id).del().then((results) => {
        res.json(results);
    });
  res.redirect("/maps");
});

app.listen(PORT, () => {
  console.log("Example app listening on port " + PORT);
});
