require('dotenv').config();
const connection = require('../src/com/tmbill/js/database');

async function main() {
  try {
    await connection.sequelize.authenticate();
    console.log('Connected to DB.');

    // 1. Delete user outlet mappings for staff users (user_id != 1)
    console.log('Deleting staff user-outlet mappings...');
    const deletedMappings = await connection.UserOutlet.destroy({
      where: {
        user_id: {
          [connection.Sequelize.Op.ne]: 1
        }
      }
    }).catch((e) => {
      console.warn('UserOutlet delete error (table might not exist):', e.message);
      return 0;
    });
    console.log(`Deleted ${deletedMappings} user-outlet mappings.`);

    // 2. Delete users other than 'admin'
    console.log('Deleting staff users...');
    const deletedUsers = await connection.User.destroy({
      where: {
        username: {
          [connection.Sequelize.Op.ne]: 'admin'
        }
      }
    });
    console.log(`Deleted ${deletedUsers} staff users.`);

    // 3. Confirm remaining users
    const users = await connection.User.findAll({ raw: true });
    console.log('Remaining users in DB:', users.map(u => ({ id: u.id, username: u.username, phone: u.phone, email: u.email, store_id: u.store_id })));
  } catch (err) {
    console.error('ERROR during deletion:', err);
  }
  process.exit(0);
}

main();
