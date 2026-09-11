import express from 'express';
import supabase from '../db/supabase.js';

// Auth middleware - reusable guard
const authMiddleware = async (req, res, next) => {
  const auth = req.get('Authorization');

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const token = auth.slice(7);

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = data.user; // Attach user to request
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export default authMiddleware;