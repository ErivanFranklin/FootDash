import AppDataSource from '../data-source';

async function revert() {
  try {
    const ds = await AppDataSource.initialize();
    console.log('DataSource initialized, undoing last migration...');
    await ds.undoLastMigration();
    console.log('Reverted successfully.');
    await ds.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Revert error', err);
    process.exit(1);
  }
}

revert();
