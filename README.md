<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Test

```bash
# unit tests
$ yarn run test

# test coverage
$ yarn run test:cov
```

# Introduction

This document provides a comprehensive overview of the Money Transfer API built using NestJS, TypeScript, and PostgreSQL. The API allows users to register, manage their balance, and transfer money to other users using usernames. They are documented below.


## Registration

Description: Registers a new user

Endpoint: /users

Method: POST

Request Body:

```bash
JSON
{
  "username": "john",
  "password": "password123"
}
```

Response:

```bash
JSON
{
  "id": 1,
  "username": "john",
  "balance": 0,
  "createdAt": "2024-10-22T08:39:48.194Z"
}
```

## Login

Description: Authenticates a user using their username and password. Returns a JWT token if successful.

Endpoint: /auth/login

Method: POST

Request Body:

```bash
JSON
{
  "username": "john",
  "password": "password123"
}
```

Response:

```bash
JSON
{
  "token": "your_jwt_token"
}
```


## Fetch Users Transfers

Description: Fetches all transfers a user has made. It expects query params username, page and limit. This endpoint is paginated

Endpoint: /users

Method: GET

Response:

```bash
JSON
[
  {
      "id": 1,
      "senderId": 3,
      "receiverId": 10,
      "amount": 100,
      "createdAt": "2024-10-21T20:56:16.954Z"
  },
  {
      "id": 2,
      "senderId": 3,
      "receiverId": 11,
      "amount": 100,
      "createdAt": "2024-10-22T07:50:22.427Z"
  },
  {
      "id": 3,
      "senderId": 3,
      "receiverId": 11,
      "amount": 100,
      "createdAt": "2024-10-22T08:41:09.288Z"
  }
]
```


## Find User BY ID

Description: Finds a user by ID. Expects the user's ID

Endpoint: /users/id/:id

Method: GET

```bash
JSON
{
  "id": 1,
  "username": "wilber",
  "balance": 100,
  "createdAt": "2024-10-22T07:48:59.581Z"
}
```

## Find User BY Username

Description: Finds a user by username. Expects the user's username

Endpoint: /users/username/:username

Method: GET

```bash
JSON
{
  "id": 1,
  "username": "wilber",
  "balance": 100,
  "createdAt": "2024-10-22T07:48:59.581Z"
}
```


## Transfer Money

Description: Transfers money from one user to another using their usernames

Endpoint: /transfers

Method: POST

Request Body:

```bash
JSON
{
   "receiverUsername": "wilber",
    "amount": 100
}
```

Response:

```bash
JSON
{
  "id": 3,
  "senderId": 3,
  "receiverId": 11,
  "amount": 100,
  "createdAt": "2024-10-22T08:41:09.288Z"
}
```

## Check User Balance

Description: Transfers money from one user to another using their usernames

Endpoint: /transfers/balance/:username

Method: GET


Response:

```bash
JSON
{
  "balance": 9600
}
```

## Authentication and Authorization
All endpoints except /users (POST) and /auth/login require JWT authentication.

## Error Handling
The API returns appropriate HTTP status codes and error messages for different scenarios, such as invalid credentials, missing required fields, and unauthorized access.

## Security
Passwords are stored securely using bcrypt hashing. Input validation is performed to prevent security vulnerabilities.

## Caching: 
Caching is implemented for user balances to enhance performance by reducing database calls.

