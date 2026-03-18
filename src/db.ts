import dbWeb, { initDB as initDBWeb, saveDoc as saveDocWeb, deleteDoc as deleteDocWeb } from './dbWeb';

/**
 * Point d'entrée de la base de données.
 * Actuellement configuré pour utiliser la version Web (LocalStorage).
 */

export const initDB = initDBWeb;
export const saveDoc = saveDocWeb;
export const deleteDoc = deleteDocWeb;

export default dbWeb;
