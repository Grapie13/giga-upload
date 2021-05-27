'use strict';

const chai = require('chai');
const {
  match,
  stub,
  restore,
  resetHistory,
} = require('sinon');
const sinonChai = require('sinon-chai');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User } = require('../../src/models/User');
const { register, login } = require('../../src/controllers/authControllers');
const { mockRequest } = require('../utils/mockRequest');
const { mockResponse } = require('../utils/mockResponse');
const { ROLES } = require('../../src/utils/constants/roles');
const { CustomError } = require('../../src/errors/CustomError');
const { FailedTest } = require('../utils/FailedTest');

chai.use(sinonChai);
const { expect } = chai;

describe('User Controllers', () => {
  const user = {
    username: 'Tester',
    password: 'password'
  };
  const users = [];
  const token = 'signedjwt';

  before(() => {
    stub(User, 'create').callsFake(userData => {
      const { username, password } = userData;
      if (!username || !password) {
        throw new Error('Username or password missing');
      }
      const savedUser = {
        username,
        password,
        role: ROLES.User,
        id: new mongoose.Types.ObjectId(),
        save: stub().resolves(true),
        comparePasswords: stub().callsFake(inputPassword => new Promise(resolve => {
          if (inputPassword === password) {
            return resolve(true);
          }
          return resolve(false);
        }))
      };
      users.push(savedUser);
      return {
        exec: stub().resolves(savedUser)
      };
    });
    stub(User, 'findOne').callsFake(userData => {
      const { username } = userData;
      if (!username) {
        throw new Error('Username missing');
      }
      return {
        select: stub().returns({
          exec: stub().resolves(users.find(dbEntry => dbEntry.username === username))
        }),
        exec: stub().resolves(users.find(dbEntry => dbEntry.username === username))
      };
    });
    stub(jwt, 'sign').returns(token);
  });

  beforeEach(() => {
    while (users.length !== 0) {
      users.pop();
    }
    resetHistory();
  });

  after(() => {
    restore();
  });

  async function createTestUser(username, password) {
    const req = mockRequest({ body: { username, password } });
    const res = mockResponse();
    await register(req, res);
    expect(res.status).to.have.been.calledWith(201);
  }

  describe('Auth Controllers', () => {
    describe('Register', () => {
      it('should throw a bad request error if a user with that username already exists', async () => {
        await createTestUser(user.username, user.password);

        const req = mockRequest({ body: { username: user.username, password: user.password } });
        const res = mockResponse();
        try {
          await register(req, res);
          throw new FailedTest();
        } catch (err) {
          expect(err).to.be.an.instanceof(CustomError);
          expect(err.statusCode).to.eq(400);
          expect(err.message).to.eq('A user with that username already exists');
        }
      });

      it('should create a new user and return a JWT', async () => {
        const req = mockRequest({ body: { username: user.username, password: user.password } });
        const res = mockResponse();
        await register(req, res);
        expect(jwt.sign).to.have.been.called;
        expect(res.status).to.have.been.calledWith(201);
        expect(res.json).to.have.been.calledWith(match({ token }));
      });
    });

    describe('Login', () => {
      it('should throw an authorization error if a user with that username does not exist', async () => {
        const req = mockRequest({ body: { username: user.username, password: user.password } });
        const res = mockResponse();
        try {
          await login(req, res);
          throw new FailedTest();
        } catch (err) {
          expect(err).to.be.an.instanceof(CustomError);
          expect(err.statusCode).to.eq(401);
          expect(err.message).to.eq('Invalid username or password');
        }
      });

      it('should throw an authorization error if user inputted password does not match the database password', async () => {
        await createTestUser(user.username, user.password);

        const req = mockRequest({ body: { username: user.username, password: 'WrongPassword' } });
        const res = mockResponse();
        try {
          await login(req, res);
          throw new FailedTest();
        } catch (err) {
          expect(err).to.be.an.instanceof(CustomError);
          expect(err.statusCode).to.eq(401);
          expect(err.message).to.eq('Invalid username or password');
        }
      });

      it('should create and return a JWT', async () => {
        await createTestUser(user.username, user.password);

        const req = mockRequest({ body: { username: user.username, password: user.password } });
        const res = mockResponse();
        await login(req, res);
        expect(jwt.sign).to.have.been.called;
        expect(res.status).to.have.been.calledWith(200);
        expect(res.json).to.have.been.calledWith(match({ token }));
      });
    });
  });
});
