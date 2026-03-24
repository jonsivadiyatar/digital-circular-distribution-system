// In-memory database for demo mode

let users = [
  {
    _id: '1',
    username: 'admin',
    email: 'admin@demo.com',
    password: 'admin123',
    role: 'admin',
    createdAt: new Date()
  },
  {
    _id: '2',
    username: 'user',
    email: 'user@demo.com',
    password: 'user123',
    role: 'user',
    createdAt: new Date()
  }
];

let circulars = [];

let userIdCounter = users.length + 1;
let circularIdCounter = 1;

let departments = [];

module.exports = {
  users,
  circulars,
  departments,
  getNextUserId: () => (userIdCounter++).toString(),
  getNextCircularId: () => (circularIdCounter++).toString(),
  getCircularIdCounter: () => (circularIdCounter++).toString(),

};
