db = db.getSiblingDB('ai-translate');

db.invitationcodes.insertOne({
  code: 'helloWorld',
  used: false,
  role: 'admin',
  createdAt: new Date(),
});
