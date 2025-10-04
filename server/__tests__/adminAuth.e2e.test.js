process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const request = require('supertest');
const jwt = require('jsonwebtoken');

const app = require('../server');
const User = require('../models/User');
const DailyContent = require('../models/DailyContent');

describe('Admin guard', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const makeToken = (id, isAdmin) =>
    jwt.sign({ id, isAdmin }, process.env.JWT_SECRET, { expiresIn: '1h' });

  it('blocks non-admin', async () => {
    const user = { _id: '507f1f77bcf86cd799439011', isAdmin: false };
    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });

    const res = await request(app)
      .get('/api/admin/daily')
      .set('Authorization', `Bearer ${makeToken(user._id, false)}`);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ message: 'Admin only' });
  });

  it('allows admin', async () => {
    const user = { _id: '507f191e810c19729de860ea', isAdmin: true };
    jest.spyOn(User, 'findById').mockReturnValue({
      select: jest.fn().mockResolvedValue(user),
    });
    jest.spyOn(DailyContent, 'find').mockReturnValue({
      sort: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      }),
    });

    const res = await request(app)
      .get('/api/admin/daily')
      .set('Authorization', `Bearer ${makeToken(user._id, true)}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ items: [] });
  });
});
