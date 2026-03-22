import * as userRepository from '../repositories/user.repository.js';
import { formatName } from '../utils/formatter.js'; // розширення .js обов'язкове!
import { createRequire } from 'module';

// JSON import в ESM потребує createRequire
const require = createRequire(import.meta.url);
const rolesMap = require('../data/roles.json');

// ВИДАЛЕНО: циклічний імпорт userController, initPermissions, getUserFormatted

export const getPublicUsers = async () => {
  const users = await userRepository.findAll();
  return users.map(u => ({
    id: u.id,
    name: formatName(u.name),
    roleName: rolesMap[u.id] || 'Unknown'
  }));
};