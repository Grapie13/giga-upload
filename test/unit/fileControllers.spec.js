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
const { File } = require('../../src/models/File');
const {
  getFile,
  getFiles,
  getUserFiles,
  createFile,
  deleteFile
} = require('../../src/controllers/fileControllers');
const { mockRequest } = require('../utils/mockRequest');
const { mockResponse } = require('../utils/mockResponse');
const { CustomError } = require('../../src/errors/CustomError');
const { FailedTest } = require('../utils/FailedTest');
const { ROLES } = require('../../src/utils/constants/roles');

chai.use(sinonChai);
const { expect } = chai;

describe('File Controllers', () => {
  const file = {
    filename: 'TestFile.jpg',
    path: 'E:\\Test\\TestFile.jpg',
    owner: new mongoose.Types.ObjectId(),
    encoding: '7bit',
    mimetype: 'image/jpeg'
  };
  const user = {
    username: 'Tester',
    role: ROLES.User
  };
  let files = [];

  before(() => {
    stub(File, 'find').callsFake(fileData => {
      const owner = fileData?.owner;
      return {
        populate: stub().returns({
          exec: stub().resolves(
            owner ? files.filter(dbEntry => dbEntry.owner === owner) : files
          )
        })
      };
    });
    stub(File, 'findOne').callsFake(fileData => {
      const id = fileData._id;
      if (!id) {
        throw new Error('ID is missing');
      }
      return {
        populate: stub().returns({
          exec: stub().resolves(files.find(dbEntry => dbEntry.id === id))
        })
      };
    });
    stub(File, 'create').callsFake(fileData => {
      const newFile = {
        ...fileData,
        id: new mongoose.Types.ObjectId(),
      };
      newFile.populate = stub().returns({
        execPopulate: stub().resolves(newFile)
      });
      files.push(newFile);
      return newFile;
    });
    stub(File, 'deleteOne').callsFake(fileData => {
      const id = fileData._id;
      if (!id) {
        throw new Error('ID is missing');
      }
      files = files.filter(dbEntry => dbEntry.id !== id);
      return {
        exec: stub().resolves(true)
      };
    });
  });

  beforeEach(() => {
    while (files.length !== 0) {
      files.pop();
    }
    resetHistory();
  });

  after(() => {
    restore();
  });

  async function createTestFile(fileData) {
    const req = mockRequest({
      file: {
        filename: fileData.filename,
        filePath: fileData.path,
        encoding: fileData.encoding,
        mimetype: fileData.mimetype
      },
      user: {
        id: fileData.owner
      }
    });
    const res = mockResponse();
    await createFile(req, res);
    expect(res.status).to.have.been.calledWith(201);
    return res.json.args[0][0].file;
  }

  describe('Get files', () => {
    it('should return an empty array if there are no files in the database', async () => {
      const req = mockRequest();
      const res = mockResponse();
      await getFiles(req, res);
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ files: [] }));
    });

    it('should return a list of all files in the database', async () => {
      await createTestFile({ ...file });

      const req = mockRequest();
      const res = mockResponse();
      await getFiles(req, res);
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ files }));
    });
  });

  describe('Get file', () => {
    it('should throw a not found error if the file does not exist', async () => {
      const req = mockRequest({ params: { fileId: 'Doesnotexist' } });
      const res = mockResponse();
      try {
        await getFile(req, res);
        throw new FailedTest();
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(404);
        expect(err.message).to.eq('File not found');
      }
    });

    it('should return a file', async () => {
      const testFile = await createTestFile({ ...file });

      const req = mockRequest({ params: { fileId: testFile.id } });
      const res = mockResponse();
      await getFile(req, res);
      expect(res.status).to.have.been.calledWith(200);
      expect(res.json).to.have.been.calledWith(match({ file: testFile }));
      const returnedFile = res.json.args[0][0].file;
      expect(returnedFile.filename).to.eq(file.filename);
      expect(returnedFile.path).to.eq(file.path);
      expect(returnedFile.owner).to.eq(file.owner);
      expect(returnedFile.mimetype).to.eq(file.mimetype);
      expect(returnedFile.encoding).to.eq(file.encoding);
    });
  });

  describe('Get user files', () => {
    it('should throw a forbidden error if the accessing user is not the owner nor an administrator', async () => {
      const req = mockRequest({ params: { username: user.username }, user: { username: 'MaliciousUser', role: ROLES.User } });
      const res = mockResponse();
      try {
        await getUserFiles(req, res);
        throw new FailedTest();
      } catch (err) {
        expect(err).to.be.an.instanceof(CustomError);
        expect(err.statusCode).to.eq(403);
        expect(err.message).to.eq('You are not authorized to access this route');
      }
    });

    it("should return an array of user's files if the accessing user is an administrator", async () => {
      await createTestFile({ ...file });

      const req = mockRequest({ params: { username: user.username } });
    });
  });
});
