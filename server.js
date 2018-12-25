const express = require("express");
const graphqlHTTP = require("express-graphql");
const bodyParser = require("body-parser");
const { buildSchema } = require("graphql");

const app = express();
app.use(bodyParser.json());

app.use(
  "/graphql",
  graphqlHTTP({
    schema: buildSchema(`
        type RootQuery {
            events: [String!]!
        }

        type RootMutation {
            createEvent(name: String): String
        }

        schema {
            query:RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
      events: () => {
        return ["All night coding", "Sailing", "Cooking"];
      },
      createEvent: args => {
        return args.name;
      }
    },
    graphiql: true
  })
);

app.listen(5000, () => console.log("Server running on port 5000"));
