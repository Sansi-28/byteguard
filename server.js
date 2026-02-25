const express = require('express');
const cors = require('cors');
const path = require('path');

require('./backend/db');

const authRoutes = require('./backend/routes/auth');
const filesRoutes = require('./backend/routes/files');
const settingsRoutes = require('./backend/routes/settings');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/settings', settingsRoutes);

// Serve React build
const clientBuild = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientBuild));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  🔐 Half Byte — Post-Quantum Research Vault`);
  console.log(`  ➜ Server running at http://localhost:${PORT}`);
  console.log(`  ➜ API base: http://localhost:${PORT}/api`);
  console.log(`  ➜ Database: data/halfbyte.db\n`);
});

module.exports = app;
