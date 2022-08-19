# solid-shop-order-service

The Solid Shop is a user-powered shopping ecosystem by use of SOLID PODs. This does the ordering part.

## Add this service to your stack

In production:

```yaml
  order:
    image: redpencil/solid-shop-order-service:latest
    environment:
      NODE_ENV: "production"
      BROKER_WEB_ID: "https://broker.mu/"
    links:
      - database:database
```

In development:

```yaml
  order:
    image: semtech/mu-javascript-template
    environment:
      NODE_ENV: "development"
      BROKER_WEB_ID: "https://broker.mu/"
    links:
      - database:database
    volumes:
      - ../solid-shop-order-service/:/app/
```

- `BROKER_WEB_ID`: The web id of the broker; your application.

## Contribution

We make use of [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).

When making changes to a pull request, we prefer to update the existing commits with a rebase instead of appending new commits.

## More information

More information about the Solid Shop can be found [in the main repository](https://github.com/redpencilio/app-solid-shop).
