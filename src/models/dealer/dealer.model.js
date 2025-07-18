const { DataTypes } = require('sequelize');
const { sequelize } = require('../../../config/db.config');

const DealerProfile = sequelize.define('DealerProfile', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  company_name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  logo_url: {
    type: DataTypes.STRING(500),
    allowNull: true
  },
  established_year: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1900,
      max: new Date().getFullYear()
    }
  },
  website_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'dealer_profiles',
  timestamps: true,
  underscored: true
});

DealerProfile.associate = function(models) {
  DealerProfile.belongsTo(models.User, {
    foreignKey: 'user_id',
    as: 'user'
  });
};

module.exports = DealerProfile;