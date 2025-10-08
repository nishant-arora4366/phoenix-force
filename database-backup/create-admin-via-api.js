// =====================================================
// PHOENIX FORCE CRICKET - CREATE ADMIN VIA API
// =====================================================
// This script creates an admin user via the registration API
// Run this in browser console or as a Node.js script
// =====================================================

async function createAdminUser() {
    try {
        // Step 1: Register the user
        const registerResponse = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: 'nishantarora1998@gmail.com',
                password: 'admin123',
                username: 'nishant',
                firstname: 'Nishant',
                lastname: 'Arora'
            })
        });

        const registerResult = await registerResponse.json();
        console.log('Registration result:', registerResult);

        if (registerResult.success) {
            console.log('✅ User registered successfully!');
            console.log('User ID:', registerResult.user.id);
            
            // Step 2: Update user role and status to admin
            const updateResponse = await fetch('/api/update-user-role', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: registerResult.user.id,
                    role: 'admin',
                    status: 'approved'
                })
            });

            const updateResult = await updateResponse.json();
            console.log('Update result:', updateResult);

            if (updateResult.success) {
                console.log('✅ User role updated to admin successfully!');
                console.log('🎉 Admin user created! You can now login with:');
                console.log('Email: nishantarora1998@gmail.com');
                console.log('Password: admin123');
            } else {
                console.error('❌ Failed to update user role:', updateResult.error);
            }
        } else {
            console.error('❌ Registration failed:', registerResult.error);
        }
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    }
}

// Run the function
createAdminUser();
