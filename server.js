const express = require("express");
const graphqlHTTP = require("express-graphql");
const bodyParser = require("body-parser");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Event = require("./models/event");
const User = require("./models/user");

const app = express();
app.use(bodyParser.json());

app.use(
  "/graphql",
  graphqlHTTP({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        type User {
            _id: ID!
            email: String!
            password: String
        }

        input EventInput {
            title: String!
            description: String!
            price: Float!
            date: String!
        }

        input UserInput {
            email: String!
            password: String!
        }

        type RootQuery {
            events: [Event!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
        }

        schema {
            query:RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
      events: () => {
        return Event.find()
          .then(events => {
            return events.map(event => {
              return { ...event._doc, _id: event.id };
            });
          })
          .catch(err => {
            throw err;
          });
      },
      createEvent: args => {
        // const event = {
        //   _id: Math.random().toString(),
        //   title: args.eventInput.title,
        //   description: args.eventInput.description,
        //   price: +args.eventInput.price,
        //   date: args.eventInput.date
        // };
        const event = new Event({
          title: args.eventInput.title,
          description: args.eventInput.description,
          price: +args.eventInput.price,
          date: new Date(args.eventInput.date),
          creator: "5c22a94240e1cb267488c1ba"
        });

        let createdEvent;
        return event
          .save()
          .then(result => {
            createdEvent = { ...result._doc, password: null, _id: result.id };
            return User.findById("5c22a94240e1cb267488c1ba");
          })
          .then(user => {
            if (!user) {
              throw new Error("USer not found");
            }
            user.createdEvents.push(event);
            return user.save();
          })
          .then(result => {
            return createdEvent;
          })
          .catch(err => {
            console.log(err);
            throw err;
          });
      },
      createUser: args => {
        return User.findOne({ email: args.userInput.email })
          .then(user => {
            if (user) {
              throw new Error("User already exists.");
            } else {
              return bcrypt.hash(args.userInput.password, 12);
            }
          })
          .then(hashedPassword => {
            const user = new User({
              email: args.userInput.email,
              password: hashedPassword
            });
            return user.save();
          })
          .then(result => {
            return { ...result._doc, password: null, _id: result.id };
          })
          .catch(err => {
            throw err;
          });
      }
    },
    graphiql: true
  })
);

mongoose
  .connect(
    `mongodb://${process.env.MONGO_USER}:${
      process.env.MONGO_PASSWORD
    }@ds141623.mlab.com:41623/gql-events`,
    { useNewUrlParser: true }
  )
  .then(() => {
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch(err => {
    console.log(err);
  });
