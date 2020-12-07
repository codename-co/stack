-- 🍪 No one just created an account
SELECT user_sign_up_with_roles('noone@example.com', 'password', '{}');

-- 🍪 User is a registered user
SELECT user_sign_up_with_roles('user@example.com', 'password', '{"user"}');
SELECT user_confirm_registration('user@example.com');
UPDATE swag.users SET first_name = 'Juan', last_name = 'Pedro' WHERE id = 2;

-- 🍪 Admin is an admin
SELECT user_sign_up_with_roles('admin@example.com', 'password', '{"admin"}');
