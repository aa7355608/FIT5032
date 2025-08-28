import * as yup from 'yup'

export const registerSchema = yup.object({
  email: yup.string().email('Invalid email').required('Required'),
  password: yup.string()
    .min(8, 'Min 8 chars')
    .matches(/[A-Z]/, 'Needs an uppercase letter')
    .matches(/[0-9]/, 'Needs a number')
    .required('Required'),
  confirm: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Required'),
  role: yup.mixed<'user' | 'admin'>().oneOf(['user','admin']).required('Required')
})

export const loginSchema = yup.object({
  email: yup.string().email('Invalid email').required('Required'),
  password: yup.string().required('Required')
})

export const reviewSchema = yup.object({
  title: yup.string().max(80, 'Max 80 chars').required('Required'),
  rating: yup.number().min(1).max(5).required('Required'),
  comment: yup.string().max(500, 'Max 500 chars')
})

