import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env file
dotenv.config({ path: path.join(__dirname, '.env') });

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

async function findAuthUserByEmail(supabase, email) {
    const targetEmail = email.toLowerCase().trim();
    let page = 1;
    const perPage = 100;

    while (true) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error) {
            console.warn(`[create-admin] Warning: could not list page ${page} of auth users:`, error.message);
            break;
        }

        const users = data?.users || [];
        const match = users.find(u => u.email?.toLowerCase().trim() === targetEmail);
        if (match) {
            return match;
        }

        if (users.length < perPage) {
            break;
        }
        page++;
    }

    // Secondary fallback: query public."User" table for mapped ID
    try {
        const { data: dbUser } = await supabase
            .from('User')
            .select('id, email')
            .ilike('email', targetEmail)
            .maybeSingle();

        if (dbUser?.id) {
            const { data: authUser, error: getAuthError } = await supabase.auth.admin.getUserById(dbUser.id);
            if (!getAuthError && authUser?.user) {
                return authUser.user;
            }
        }
    } catch (err) {
        // Silently continue if public.User query encounters RLS/connection issue
    }

    return null;
}

function decodeJwtRole(token) {
    try {
        const parts = token.split('.');
        if (parts.length >= 2) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            return payload.role;
        }
    } catch {
        return null;
    }
    return null;
}

async function createAdmin() {
    console.log('\n=========================================');
    console.log('  WorldDucationCentre Admin Provisioning  ');
    console.log('=========================================\n');

    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    let supabaseServiceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)?.trim();
    const viteAnonKey = process.env.VITE_SUPABASE_ANON_KEY?.trim();
    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();
    const adminName = (process.env.ADMIN_NAME || 'System Admin').trim();

    // 1. Detect if keys were swapped in .env
    const serviceKeyRole = decodeJwtRole(supabaseServiceKey);
    const viteKeyRole = decodeJwtRole(viteAnonKey);

    if (serviceKeyRole === 'anon' && viteKeyRole === 'service_role') {
        console.warn('⚠️ Warning: SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_ANON_KEY are swapped in .env.');
        console.warn('   Automatically using the service_role key for admin provisioning.');
        supabaseServiceKey = viteAnonKey;
    } else if (serviceKeyRole === 'anon') {
        console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY has role "anon". Admin actions require the Supabase "service_role" secret key.');
        process.exit(1);
    }

    // 2. Validate Environment Variables
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('SUPABASE_URL');
    if (!supabaseServiceKey) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');
    if (!adminEmail) missingVars.push('ADMIN_EMAIL');
    if (!adminPassword) missingVars.push('ADMIN_PASSWORD');

    if (missingVars.length > 0) {
        console.error(`❌ Error: Missing required environment variables in .env:\n   - ${missingVars.join('\n   - ')}`);
        console.error('\nPlease verify your .env file contains valid configuration.');
        process.exit(1);
    }

    if (!validateEmail(adminEmail)) {
        console.error(`❌ Error: Invalid ADMIN_EMAIL format: "${adminEmail}"`);
        process.exit(1);
    }

    if (adminPassword.length < 6) {
        console.error('❌ Error: ADMIN_PASSWORD must be at least 6 characters long.');
        process.exit(1);
    }

    // 2. Initialize Supabase Admin Client
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    console.log(`[create-admin] Target Admin: ${adminEmail} (${adminName})`);

    // 3. Check for Existing Auth User
    let userId;
    const existingUser = await findAuthUserByEmail(supabase, adminEmail);

    if (existingUser) {
        console.log(`[create-admin] User already exists in Supabase Auth (ID: ${existingUser.id}).`);
        console.log('[create-admin] Updating credentials, setting email_confirm to true, and granting ADMIN metadata...');

        const { data: updated, error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            {
                password: adminPassword,
                email_confirm: true,
                user_metadata: {
                    ...(existingUser.user_metadata || {}),
                    name: adminName,
                    role: 'ADMIN'
                },
                app_metadata: {
                    ...(existingUser.app_metadata || {}),
                    role: 'ADMIN'
                }
            }
        );

        if (updateError) {
            console.error('❌ Error updating Supabase Auth user:', updateError.message);
            process.exit(1);
        }

        userId = updated.user.id;
        console.log('✓ Supabase Auth user updated successfully.');
    } else {
        console.log('[create-admin] Creating new Supabase Auth user...');

        const { data: created, error: createError } = await supabase.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: {
                name: adminName,
                role: 'ADMIN'
            },
            app_metadata: {
                role: 'ADMIN'
            }
        });

        if (createError) {
            console.error('❌ Error creating Supabase Auth user:', createError.message);
            process.exit(1);
        }

        userId = created.user.id;
        console.log('✓ Supabase Auth user created successfully.');
    }

    // 4. Synchronize Public "User" Table with ADMIN Role
    console.log('[create-admin] Synchronizing public."User" database record...');
    const { error: dbError } = await supabase
        .from('User')
        .upsert({
            id: userId,
            email: adminEmail,
            name: adminName,
            role: 'ADMIN',
            updatedAt: new Date().toISOString()
        }, { onConflict: 'id' });

    if (dbError) {
        console.error('❌ Error updating public."User" table:', dbError.message);
        process.exit(1);
    }
    console.log('✓ Public "User" table record saved with role = ADMIN.');

    // 5. Ensure Wallet Record Exists
    try {
        const { data: walletData, error: walletQueryError } = await supabase
            .from('Wallet')
            .select('id')
            .eq('userId', userId)
            .maybeSingle();

        if (walletQueryError) {
            console.warn('[create-admin] Note on Wallet query:', walletQueryError.message);
        } else if (!walletData) {
            const { error: walletInsertError } = await supabase
                .from('Wallet')
                .insert({
                    userId: userId,
                    balance: 0,
                    currency: 'USD'
                });

            if (walletInsertError) {
                console.warn('[create-admin] Note on Wallet creation:', walletInsertError.message);
            } else {
                console.log('✓ Wallet record initialized.');
            }
        } else {
            console.log('✓ Wallet record verified.');
        }
    } catch (err) {
        console.warn('[create-admin] Could not verify Wallet:', err.message);
    }

    // 6. Ensure Stats Record Exists
    try {
        const { data: statsData, error: statsQueryError } = await supabase
            .from('Stats')
            .select('id')
            .eq('userId', userId)
            .maybeSingle();

        if (statsQueryError) {
            console.warn('[create-admin] Note on Stats query:', statsQueryError.message);
        } else if (!statsData) {
            const { error: statsInsertError } = await supabase
                .from('Stats')
                .insert({
                    userId: userId,
                    eventsAttended: 0,
                    blogPostsCount: 0,
                    points: 0
                });

            if (statsInsertError) {
                console.warn('[create-admin] Note on Stats creation:', statsInsertError.message);
            } else {
                console.log('✓ Stats record initialized.');
            }
        } else {
            console.log('✓ Stats record verified.');
        }
    } catch (err) {
        console.warn('[create-admin] Could not verify Stats:', err.message);
    }

    // 7. Verify Final Status
    const { data: verifiedProfile, error: verifyError } = await supabase
        .from('User')
        .select('id, email, name, role, createdAt')
        .eq('id', userId)
        .single();

    if (verifyError || !verifiedProfile) {
        console.warn('⚠️ Warning: Admin created but failed to query verification profile:', verifyError?.message);
    } else {
        console.log('\n=========================================');
        console.log('🎉 Admin User Successfully Ready!');
        console.log('=========================================');
        console.log(`User ID : ${verifiedProfile.id}`);
        console.log(`Email   : ${verifiedProfile.email}`);
        console.log(`Name    : ${verifiedProfile.name}`);
        console.log(`Role    : ${verifiedProfile.role}`);
        console.log('=========================================\n');
    }
}

createAdmin().catch((err) => {
    console.error('❌ Unexpected fatal error in createAdmin:', err);
    process.exit(1);
});
