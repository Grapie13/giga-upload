'use strict';

const chai = require('chai');
const {
  match,
  stub,
  restore,
  resetHistory,
} = require('sinon');
const sinonChai = require('sinon-chai');
const mongoose = require('mongoose');
const { User } = require('../../src/models/User');
const {
  getAllUsers, createUser, updateUser, deleteUser, getUser
} = require('../../src/controllers/userControllers');
const { mockRequest } = require('./utils/mockRequest');
const { mockResponse } = require('./utils/mockResponse');
const { ROLES } = require('../../src/utils/constants/roles');
const { CustomError } = require('../../src/errors/CustomError');
const { FailedTest } = require('../shared utils/FailedTest');

chai.use(sinonChai);
const { expect } = chai;

describe('User Controllers', () => {
  const user = {
    username: 'Tester',
    password: 'password'
  };
  let users = [];

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
      };
      users.push(savedUser);
      return savedUser;
    });
    stub(User, 'deleteOne').callsFake(userData => {
      const { username } = userData;
      if (!username) {
        throw new Error('Username missing');
      }
      users = users.filter(dbEntry => dbEntry.username !== username);
      return {
        exec: stub().resolves(true)
      };
    });
    stub(User, 'find').returns({
      select: stub().returns({
        exec: stub().resolves(users)
      })
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
    const req = mockRequest({
      body: { username, password }
    });
    const res = mockResponse();
    await createUser(req, res);
    expect(res.status).to.have.been.calledWith(201);
  }

  describe('Get all users', () => {
    it('should return an empty array if no users are in the database', async () => {
      const req = mockRequest();
      const res = mockResponse();
      await getAllUsers(req, res);
      expect(User.find).to.have.been.called;
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ users: [] }));
    });

    it('should return an array of existing users', async () => {
      await createTestUser(user.username, user.password);

      const req = mockRequest();
      const res = mockResponse();
      await getAllUsers(req, res);
      expect(User.find).to.have.been.called;
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ users }));
    });
  });

  describe('Get user', () => {
    it('should throw a not found error if the user does not exist', async () => {
      const req = mockRequest({ params: { username: user.username } });
      const res = mockResponse();
      try {
        await getUser(req, res);
        throw new FailedTest();
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(404);
        expect(err.message).to.eq('A user with that username does not exist');
      }
    });

    it('should throw a forbidden error if the accessing user is not the account owner or an administrator', async () => {
      await createTestUser(user.username, user.password);

      const req = mockRequest({ params: { username: user.username }, user: { username: 'AnotherUser' } });
      const res = mockResponse();
      try {
        await getUser(req, res);
        throw new FailedTest();
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(403);
        expect(err.message).to.eq('You are not authorized to access this route');
      }
    });

    it("should return a user's details", async () => {
      await createTestUser(user.username, user.password);

      const req = mockRequest({ params: { username: user.username }, user: { username: user.username } });
      const res = mockResponse();
      await getUser(req, res);
      expect(res.status).to.have.been.calledWith(200);
      const returnedUser = res.json.args[0][0].user;
      expect(returnedUser.username).to.eq(user.username);
    });
  });

  describe('Create user', () => {
    it('should throw a bad request error if a user with that username already exists', async () => {
      const req = mockRequest({ body: { username: user.username, password: user.password } });
      const res = mockResponse();
      await createUser(req, res);
      expect(res.status).to.have.been.calledWith(201);

      try {
        await createUser(req, res);
        throw new FailedTest();
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(400);
        expect(err.message).to.eq('A user with that username already exists');
      }
    });

    it('should create a user and return it', async () => {
      const req = mockRequest({ body: { username: user.username, password: user.password } });
      const res = mockResponse();
      await createUser(req, res);
      expect(User.create).to.have.been.called;
      expect(res.status).to.have.been.calledWith(201);
      const returnedUser = res.json.args[0][0].user;
      expect(returnedUser.username).to.eq(user.username);
      expect(users.length).to.eq(1);
    });
  });

  describe('Update user', () => {
    it('should throw a not found error if the updated user does not exist', async () => {
      const req = mockRequest({
        params: { username: user.username },
        body: { role: ROLES.Administrator },
        user: { username: 'Admin', role: ROLES.Administrator }
      });
      const res = mockResponse();
      try {
        await updateUser(req, res);
        throw new FailedTest();
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(404);
        expect(err.message).to.eq('A user with that username does not exist');
      }
    });

    it('should throw a forbidden error if the updating user is not the owner of the account nor an administrator', async () => {
      await createTestUser(user.username, user.password);

      const newPassword = 'newPassword';
      const req = mockRequest({
        params: { username: user.username },
        body: { password: newPassword },
        user: { username: 'MaliciousUser', role: ROLES.User }
      });
      const res = mockResponse();
      try {
        await updateUser(req, res);
        throw new FailedTest();
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(403);
        expect(err.message).to.eq('You are not authorized to access this route');
      }
    });

    it('should throw a forbidden error if a role is updated by someone who is not an administrator', async () => {
      await createTestUser(user.username, user.password);

      const req = mockRequest({
        params: { username: user.username },
        body: { role: ROLES.Administrator },
        user: { username: 'MaliciousUser', role: ROLES.User }
      });
      const res = mockResponse();
      try {
        await updateUser(req, res);
        throw new FailedTest();
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(403);
        expect(err.message).to.eq('You are not authorized to access this route');
      }
    });

    it("should update a user's password", async () => {
      await createTestUser(user.username, user.password);

      const newPassword = 'newPassword';
      const req = mockRequest({
        params: { username: user.username },
        body: { password: newPassword },
        user: { username: user.username, role: ROLES.User }
      });
      const res = mockResponse();
      await updateUser(req, res);
      const updatedUser = users.find(dbEntry => dbEntry.username === user.username);
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ user: { ...updatedUser, password: newPassword } }));
    });

    it("should update a user's role if the updating user is an administrator", async () => {
      await createTestUser(user.username, user.password);

      const req = mockRequest({
        params: { username: user.username },
        body: { role: ROLES.Administrator },
        user: { role: ROLES.Administrator }
      });
      const res = mockResponse();
      await updateUser(req, res);
      const updatedUser = users.find(dbEntry => dbEntry.username === user.username);
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ user: { ...updatedUser, role: ROLES.Administrator } }));
    });
  });

  describe('Delete user', () => {
    it('should throw a not found error if the deleted user does not exist', async () => {
      const req = mockRequest({
        params: { username: user.username },
        user: { username: user.username }
      });
      const res = mockResponse();
      try {
        await deleteUser(req, res);
        throw new FailedTest();
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(404);
        expect(err.message).to.eq('A user with that username does not exist');
      }
    });

    it('should throw a forbidden error if the deleting user is not the owner of the account nor an administrator', async () => {
      await createTestUser(user.username, user.password);

      const req = mockRequest({
        params: { username: user.username },
        user: { username: 'MaliciousUser', role: ROLES.User }
      });
      const res = mockResponse();
      try {
        await deleteUser(req, res);
        throw new FailedTest();
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(403);
        expect(err.message).to.eq('You are not authorized to access this route');
      }
    });

    it('should remove a user from the database if deleting user is the owner of the account', async () => {
      await createTestUser(user.username, user.password);

      const deletedUser = users[0];
      const req = mockRequest({
        params: { username: user.username },
        user: { username: user.username }
      });
      const res = mockResponse();
      await deleteUser(req, res);
      expect(User.deleteOne).to.have.been.called;
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ message: 'User deleted successfully' }));
      expect(users).to.not.include(deletedUser);
    });

    it('should remove a user from the database if deleting user is an administrator', async () => {
      await createTestUser(user.username, user.password);

      const deletedUser = users[0];
      const req = mockRequest({
        params: { username: user.username },
        user: { username: 'Admin', role: ROLES.Administrator }
      });
      const res = mockResponse();
      await deleteUser(req, res);
      expect(User.deleteOne).to.have.been.called;
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ message: 'User deleted successfully' }));
      expect(users).to.not.include(deletedUser);
    });
  });
});
