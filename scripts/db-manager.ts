import { db } from '../database/config';
import { DatabaseService } from '../services/databaseService';

const commands = {
  'list-users': async () => {
    const users = await DatabaseService.getUsers();
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - ${user.role}`);
    });
  },
  
  'list-vehicles': async () => {
    const vehicles = await DatabaseService.getVehicles();
    console.log(`Found ${vehicles.length} vehicles:`);
    vehicles.forEach(vehicle => {
      console.log(`- ${vehicle.make} ${vehicle.model} (${vehicle.year}) - $${vehicle.price}`);
    });
  },
  
  'db-stats': async () => {
    const users = await DatabaseService.getUsers();
    const vehicles = await DatabaseService.getVehicles();
    const conversations = await DatabaseService.getConversations();
    const auditLogs = await DatabaseService.getAuditLogs();
    const notifications = await DatabaseService.getNotifications();
    
    console.log('Database Statistics:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Vehicles: ${vehicles.length}`);
    console.log(`- Conversations: ${conversations.length}`);
    console.log(`- Audit Logs: ${auditLogs.length}`);
    console.log(`- Notifications: ${notifications.length}`);
  },
  
  'clear-db': async () => {
    console.log('Clearing all database tables...');
    db.exec('DELETE FROM vehicles');
    db.exec('DELETE FROM users');
    db.exec('DELETE FROM conversations');
    db.exec('DELETE FROM audit_logs');
    db.exec('DELETE FROM notifications');
    db.exec('DELETE FROM settings');
    db.exec('DELETE FROM faqs');
    db.exec('DELETE FROM support_tickets');
    console.log('Database cleared successfully!');
  },
  
  'help': () => {
    console.log('Available commands:');
    console.log('- list-users: List all users');
    console.log('- list-vehicles: List all vehicles');
    console.log('- db-stats: Show database statistics');
    console.log('- clear-db: Clear all data from database');
    console.log('- help: Show this help message');
  }
};

const main = async () => {
  const command = process.argv[2];
  
  if (!command || !commands[command as keyof typeof commands]) {
    console.log('Usage: npm run db-manager <command>');
    console.log('Use "help" command to see available options.');
    process.exit(1);
  }
  
  try {
    await commands[command as keyof typeof commands]();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

main();
