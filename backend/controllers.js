// backend/controllers.js - Updated to handle email gracefully

register: async (req, res) => {
  const { username, email, password, role = 'user' } = req.body;
  
  try {
    console.log('📝 Register:', { username, email });

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields required' });
    }

    const pool = getPgPool();
    if (!pool) {
      return res.status(500).json({ error: 'Database error' });
    }

    // Check if user exists
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password and create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, role, is_developer, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, username, email, role`,
      [username, email, hashedPassword, role, role === 'developer']
    );

    const user = result.rows[0];
    console.log('✅ User created:', user.username);

    // Create token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );

    // Try to send welcome email - don't fail if it doesn't work
    try {
      await emailService.sendWelcomeEmail(email, username);
    } catch (emailError) {
      console.log('📧 Welcome email skipped (not configured)');
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! You can now login.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
},
