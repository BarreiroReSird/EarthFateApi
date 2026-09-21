const supabase = require('./supabase');

async function findUserByUsername(username) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

async function createUser(user) {
    const { data, error } = await supabase.from('users').insert(user).select().single();
    if (error) throw error;
    return data;
}

async function findCharacter(id) {
    const { data, error } = await supabase.from('characters').select('*').eq('id', id).single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

async function getRandomCharacter() {
    const { count, error: countError } = await supabase
        .from('characters')
        .select('*', { count: 'exact', head: true });

    if (countError) throw countError;
    if (!count || count === 0) return null;

    const randomOffset = Math.floor(Math.random() * count);
    const { data, error } = await supabase
        .from('characters')
        .select('*')
        .range(randomOffset, randomOffset)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
}

async function createCharacter(character) {
    const { data, error } = await supabase.from('characters').insert(character).select().single();
    if (error) throw error;
    return data;
}

async function updateCharacter(id, fields) {
    const { data, error } = await supabase
        .from('characters')
        .update(fields)
        .eq('id', id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

module.exports = {
    findUserByUsername,
    createUser,
    findCharacter,
    getRandomCharacter,
    createCharacter,
    updateCharacter,
};
