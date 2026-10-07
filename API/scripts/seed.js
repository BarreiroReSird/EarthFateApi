// Puts the monsters into the spreadsheet so GET /characters/random returns real
// data instead of falling back to DEFAULT_MONSTER. Safe to run more than once:
// an id that is already there is skipped, so re-running never doubles a row.
//
// Usage: npm run seed
const store = require('../utils/store');

// ids are slugs because utils/validators.js accepts letters, numbers, hyphen
// and underscore, and "monster_1" is referenced by DEFAULT_MONSTER and the
// README. Keep that one.
const MONSTERS = [
    { id: 'monster_1', name: 'Dragon', atk: 15, intelligence: 15, health: 75, img: 'dragon.png' },
    { id: 'monster_2', name: 'Goblin', atk: 25, intelligence: 8, health: 40, img: 'goblin.png' },
    { id: 'monster_3', name: 'Wolf', atk: 30, intelligence: 5, health: 55, img: 'wolf.png' },
    {
        id: 'monster_4',
        name: 'Skeleton',
        atk: 20,
        intelligence: 12,
        health: 45,
        img: 'skeleton.png',
    },
    { id: 'monster_5', name: 'Troll', atk: 35, intelligence: 6, health: 120, img: 'troll.png' },
];

const seed = async () => {
    let added = 0;
    let skipped = 0;

    for (const monster of MONSTERS) {
        const existing = await store.findCharacter(monster.id);

        if (existing) {
            skipped += 1;
            console.log(`skip    ${monster.id} (${monster.name}) - already in the sheet`);
            continue;
        }

        await store.createCharacter({ ...monster, isMonster: true, idPlayer: 'npc' });
        added += 1;
        console.log(`seeded  ${monster.id} (${monster.name})`);
    }

    console.log(`\n${added} added, ${skipped} already there.`);
};

seed().catch((error) => {
    console.error('Seeding failed:', error.message);
    console.error('Check GOOGLE_SHEET_ID and the service account credentials in .env.');
    process.exit(1);
});
