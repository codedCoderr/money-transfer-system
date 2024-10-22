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

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

# Introduction

This API provides endpoints for user and role management, including authentication, registration, role assignment, and user deletion. It uses NestJS, Prisma, and SQL for backend implementation. They are documented below.


## Registration

Description: Registers a new user

Endpoint: /auth/register

Method: POST

Request Body:

```bash
JSON
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123"
}
```

Response:

```bash
JSON
{
  "id": 1,
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com"
}
```

## Login

Description: Authenticates a user using their email and password. Returns a JWT token if successful.

Endpoint: /auth/login

Method: POST

Request Body:

```bash
JSON
{
  "email": "john.doe@example.com",
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




## Fetch Users

Description: Fetches a list of all users, including their assigned roles

Endpoint: /users

Method: GET

Response:

```bash
JSON
[
  {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "roles": [
      {
        "id": 1,
        "name": "Admin"
      }
    ]
  },
  // ... other users
]
```


## Delete User

Description: Deletes a user with a specified user ID. Requires the Admin role.

Endpoint: /users/:id

Method: DELETE


## Create Role

Description: Creates a new role

Endpoint: /roles

Method: POST

Request Body:

```bash
JSON
{
  "name": "Admin",
  "permissions": ["READ", "WRITE"]
}
```

Response:

```bash
JSON
{
  "id": 142,
  "name": "userw",
  "permissions": [
      "READ"
  ]
}
```

## Assign Role

Description: Assigns a role to a user

Endpoint: /users/:id/assign-role

Method: POST

Request Body:

```bash
JSON
{
  "roleName": "admin"
}
```


## Authentication and Authorization
All endpoints except /auth/login and /auth/register require JWT authentication. The RolesGuard is used to enforce role-based access control. Only users with the Admin role can access the /users/:id DELETE endpoint.

## Error Handling
The API returns appropriate HTTP status codes and error messages for different scenarios, such as invalid credentials, missing required fields, and unauthorized access.

## Security
Passwords are stored securely using bcrypt hashing. Input validation is performed to prevent security vulnerabilities.
# money-transfer-system
