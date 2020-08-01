module.exports = {
  dialect: 'postgres',
  host: 'localhost',
  username: 'postgres',
  password: 'docker',
  database: 'gympro',
  define: {
    timestamps: true,
    underscored: true,
    underscoredAll: true,
  },
};
