import { Request, Response, NextFunction } from 'express';

export interface ValidationErrorItem {
  field: string;
  message: string;
}

export function validateRegistration(req: Request, res: Response, next: NextFunction) {
  const { name, email, password, phone } = req.body;
  const errors: ValidationErrorItem[] = [];

  // Name validation
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Full Name is required.' });
  } else if (name.trim().length < 2) {
    errors.push({ field: 'name', message: 'Name must be at least 2 characters long.' });
  } else if (name.trim().length > 50) {
    errors.push({ field: 'name', message: 'Name cannot exceed 50 characters.' });
  }

  // Email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email address is required.' });
  } else if (!emailRegex.test(email.trim())) {
    errors.push({ field: 'email', message: 'Please enter a valid email format (e.g. user@domain.com).' });
  }

  // Password validation & strength check
  if (!password || typeof password !== 'string') {
    errors.push({ field: 'password', message: 'Password is required.' });
  } else {
    if (password.length < 6) {
      errors.push({ field: 'password', message: 'Password must be at least 6 characters long.' });
    }
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      errors.push({
        field: 'password',
        message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number.',
      });
    }
  }

  // Phone validation (optional, but if provided must match standard digits)
  if (phone && typeof phone === 'string' && phone.trim().length > 0) {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(phone.trim())) {
      errors.push({ field: 'phone', message: 'Please enter a valid telephone format (e.g. +1 555-0199 or 555-0199).' });
    }
  }

  if (errors.length > 0) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid registration inputs.',
        errors,
      });
    }

    // Server-side rendered form re-render with errors and persisted inputs
    return res.status(400).render('pages/register', {
      title: 'Register - TaskFlow',
      errors,
      values: { name, email, phone },
      page: 'register',
    });
  }

  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;
  const errors: ValidationErrorItem[] = [];

  if (!email || typeof email !== 'string' || email.trim().length === 0) {
    errors.push({ field: 'email', message: 'Email address is required.' });
  }

  if (!password || typeof password !== 'string' || password.length === 0) {
    errors.push({ field: 'password', message: 'Password is required.' });
  }

  if (errors.length > 0) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid credentials entered.',
        errors,
      });
    }

    return res.status(400).render('pages/login', {
      title: 'Login - TaskFlow',
      errors,
      values: { email },
      page: 'login',
    });
  }

  next();
}

export function validateTask(req: Request, res: Response, next: NextFunction) {
  const { title, description, priority, status, category, deadline } = req.body;
  const errors: ValidationErrorItem[] = [];

  // Title check
  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    errors.push({ field: 'title', message: 'Task Title is required.' });
  } else if (title.trim().length < 3) {
    errors.push({ field: 'title', message: 'Task Title must be at least 3 characters long.' });
  } else if (title.trim().length > 120) {
    errors.push({ field: 'title', message: 'Task Title cannot exceed 120 characters.' });
  }

  // Description check
  if (description && typeof description === 'string' && description.length > 1000) {
    errors.push({ field: 'description', message: 'Description cannot exceed 1000 characters.' });
  }

  // Priority check
  const validPriorities = ['Low', 'Medium', 'High', 'Urgent'];
  if (priority && !validPriorities.includes(priority)) {
    errors.push({ field: 'priority', message: `Priority must be one of: ${validPriorities.join(', ')}` });
  }

  // Status check
  const validStatuses = ['Pending', 'In Progress', 'Completed'];
  if (status && !validStatuses.includes(status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${validStatuses.join(', ')}` });
  }

  // Category check
  const validCategories = ['Work', 'Personal', 'Study', 'Health', 'Finance', 'Other'];
  if (category && !validCategories.includes(category)) {
    errors.push({ field: 'category', message: `Category must be one of: ${validCategories.join(', ')}` });
  }

  // Deadline check
  if (deadline && deadline.trim() !== '') {
    const parsedDate = new Date(deadline);
    if (isNaN(parsedDate.getTime())) {
      errors.push({ field: 'deadline', message: 'Please provide a valid ISO date or timestamp.' });
    }
  }

  if (errors.length > 0) {
    if (req.originalUrl.startsWith('/api/')) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: 'Invalid task parameters.',
        errors,
      });
    }

    const isEdit = req.originalUrl.includes('/edit');
    return res.status(400).render('pages/task-form', {
      title: isEdit ? 'Edit Task - TaskFlow' : 'Create Task - TaskFlow',
      isEdit,
      task: { ...req.body, _id: req.params.id },
      errors,
      page: 'tasks',
    });
  }

  next();
}
